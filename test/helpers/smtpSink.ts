import net from 'node:net'

export interface SinkMessage {
    raw: string
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
