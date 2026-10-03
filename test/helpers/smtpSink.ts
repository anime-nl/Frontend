import net from 'node:net'

export interface SinkMessage {
    raw: string
}

function decodeQuotedPrintableRun(text: string): string {
    const bytes: number[] = []
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(text.slice(i + 1, i + 3))) {
            bytes.push(parseInt(text.slice(i + 1, i + 3), 16))
            i += 2
        } else {
            bytes.push(text.charCodeAt(i))
        }
    }
    return Buffer.from(bytes).toString('utf8')
}

/**
 * nodemailer MIME-encodes non-ASCII subjects (RFC 2047 encoded-words) and non-ASCII bodies
 * (quoted-printable), so a raw sink message with accented characters cannot be substring-matched
 * directly. Decodes both back to plain UTF-8 text; a no-op on already-plain-ASCII messages.
 * @param raw A sink message's raw SMTP DATA payload
 * @returns The message with its header words and body decoded to plain text
 */
export function decodeMimeMessage(raw: string): string {
    const headersDecoded = raw.replace(
        /=\?UTF-8\?Q\?([^?]*)\?=(?:\r?\n[ \t]+(?==\?UTF-8\?Q\?))?/gi,
        (_match, inner: string) => decodeQuotedPrintableRun(inner.replace(/_/g, ' '))
    )

    const blankLineIndex = headersDecoded.indexOf('\n\n')
    if (blankLineIndex === -1) return headersDecoded

    // RFC 5322 header folding: nodemailer wraps long plain-ASCII header lines (e.g. a long Subject)
    // at a space, continuing on a line that starts with whitespace. Unfolding unwraps that back to
    // a single space, same as it would render in any real mail client.
    const headers = headersDecoded.slice(0, blankLineIndex).replace(/\n[ \t]+/g, ' ')
    const body = headersDecoded.slice(blankLineIndex + 2)
    return `${headers}\n\n${decodeQuotedPrintableRun(body.replace(/=\n/g, ''))}`
}

/** Minimal SMTP server that accepts every message, or rejects it when `rejectMail` is set */
export async function startSmtpSink() {
    const messages: SinkMessage[] = []
    const sink = {rejectMail: false}

    const server = net.createServer((socket) => {
        let inData = false
        let buffer = ''
        const reply = (line: string) => socket.write(`${line}\r\n`)

        reply('220 sink ESMTP')

        socket.on('data', (chunk) => {
            buffer += chunk

            if (inData) {
                if (!buffer.endsWith('\r\n.\r\n')) return
                inData = false
                if (sink.rejectMail) {
                    reply('554 rejected')
                } else {
                    messages.push({raw: buffer.replace(/\r/g, '')})
                    reply('250 queued')
                }
                buffer = ''
                return
            }

            for (const line of buffer.split('\r\n').filter(Boolean)) {
                const command = line.slice(0, 4).toUpperCase()
                if (command === 'DATA') {
                    reply('354 go ahead')
                    inData = true
                    buffer = ''
                    return
                }
                if (command === 'QUIT') {
                    reply('221 bye')
                    socket.end()
                } else {
                    reply(command === 'EHLO' ? '250 sink' : '250 ok')
                }
            }
            buffer = ''
        })
    })

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))

    return {
        port: (server.address() as net.AddressInfo).port,
        messages,
        sink,
        close: () => new Promise<void>((resolve) => server.close(() => resolve()))
    }
}
