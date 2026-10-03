import nodemailer from 'nodemailer'
import {findSupportTopic, normalizeSupportRequest, validateSupportRequest} from '#shared/utils/support'
import {DEFAULT_LOCALE, isSupportedLocale, translate} from '#shared/utils/i18n'
import {isRateLimited} from '../utils/rateLimit'

const SUPPORT_RATE_LIMIT = {limit: 5, windowMs: 10 * 60 * 1000}

/**
 * POST /api/support - validates a support request and emails it to the support inbox, composed in
 * the locale from the `x-site-locale` request header (falling back to Dutch if missing/unsupported).
 * @returns Confirmation that the request was handled, including silently for bots and dev without SMTP
 */
export default defineEventHandler(async (event) => {
    const ip = getRequestIP(event, {xForwardedFor: true}) ?? 'unknown'
    if (isRateLimited(`support:${ip}`, SUPPORT_RATE_LIMIT)) {
        throw createError({statusCode: 429, statusMessage: 'Too many support requests, please try again later'})
    }

    const body = normalizeSupportRequest(await readBody(event))

    // Bots fill in the hidden field, pretend it worked so they don't retry
    if (body.website) return {ok: true}

    const errors = validateSupportRequest(body)
    if (errors.length) {
        throw createError({statusCode: 400, statusMessage: 'Invalid support request', data: errors})
    }

    const config = useRuntimeConfig(event)
    const topic = findSupportTopic(body.topic)!
    const requestedLocale = getRequestHeader(event, 'x-site-locale')
    const locale = isSupportedLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE
    const topicTitle = translate(locale, `support.topics.${topic.slug}.title`)
    const reasonText = translate(locale, `support.topics.${topic.slug}.reasons.${body.reason}`)
    const orderPrefix = body.orderNumber
        ? `${translate(locale, 'support.email.subjectOrderPrefix', {orderNumber: body.orderNumber})} - `
        : ''
    const subject = `[${topicTitle}] ${orderPrefix}${reasonText}`
    const text = [
        `${translate(locale, 'support.email.topicLabel')} ${topicTitle}`,
        `${translate(locale, 'support.email.reasonLabel')} ${reasonText}`,
        `${translate(locale, 'support.email.orderNumberLabel')} ${body.orderNumber || '-'}`,
        `${translate(locale, 'support.email.nameLabel')} ${body.name}`,
        `${translate(locale, 'support.email.emailLabel')} ${body.email}`,
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
            replyTo: {name: body.name.replace(/["<>]/g, ''), address: body.email},
            subject,
            text
        })
    } catch (error) {
        console.error('Failed to send support email:', error)
        throw createError({statusCode: 502, statusMessage: 'Could not send your message'})
    }

    return {ok: true}
})
