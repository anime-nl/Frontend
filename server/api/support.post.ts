import nodemailer from 'nodemailer'
import {findSupportTopic, normalizeSupportRequest, validateSupportRequest} from '#shared/utils/support'

export default defineEventHandler(async (event) => {
    const body = normalizeSupportRequest(await readBody(event))

    // Bots fill in the hidden field, pretend it worked so they don't retry
    if (body.website) return {ok: true}

    const errors = validateSupportRequest(body)
    if (errors.length) {
        throw createError({statusCode: 400, statusMessage: 'Invalid support request', data: errors})
    }

    const config = useRuntimeConfig(event)
    const topic = findSupportTopic(body.topic)!
    const subject = `[${topic.title}] ${body.orderNumber ? `Order ${body.orderNumber} - ` : ''}${body.reason}`
        .replace(/\s+/g, ' ')
    const text = [
        `Topic: ${topic.title}`,
        `Reason: ${body.reason}`,
        `Order number: ${body.orderNumber || '-'}`,
        `Name: ${body.name}`,
        `Email: ${body.email}`,
        '',
        body.message
    ].join('\n')

    if (!config.smtpHost) {
        if (import.meta.dev) {
            console.info(`SMTP_HOST is not set, not sending:\n${subject}\n\n${text}`)
            return {ok: true}
        }
        throw createError({statusCode: 503, statusMessage: 'Support email is not configured'})
    }

    const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: config.smtpUser ? {user: config.smtpUser, pass: config.smtpPass} : undefined
    })

    try {
        await transporter.sendMail({
            from: config.public.supportEmail,
            to: config.public.supportEmail,
            replyTo: {name: body.name.replace(/[\r\n"<>]/g, ''), address: body.email},
            subject,
            text
        })
    } catch (error) {
        console.error('Failed to send support email:', error)
        throw createError({statusCode: 502, statusMessage: 'Could not send your message'})
    }

    return {ok: true}
})
