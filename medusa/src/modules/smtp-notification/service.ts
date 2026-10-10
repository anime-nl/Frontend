import {AbstractNotificationProviderService, MedusaError} from '@medusajs/framework/utils'
import type {ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO} from '@medusajs/framework/types'
import nodemailer, {type Transporter} from 'nodemailer'
import {ORDER_CONFIRMATION_TEMPLATE, renderOrderConfirmation, type OrderConfirmationData} from './order-confirmation'

export interface SmtpNotificationOptions {
  host: string
  port: number
  user?: string
  pass?: string
  from: string
}

/** Sends Medusa email notifications over SMTP (Mailpit locally, Brevo in production). */
export class SmtpNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = 'smtp'

  private readonly transporter: Transporter
  private readonly from: string

  /**
   * @param _container Medusa's module container (unused)
   * @param options SMTP connection settings and the sender address
   */
  constructor(_container: Record<string, unknown>, options: SmtpNotificationOptions) {
    super()
    this.from = options.from
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.port === 465,
      auth: options.user ? {user: options.user, pass: options.pass} : undefined
    })
  }

  /**
   * Sends one notification as an email.
   * @param notification The notification to send; only the order confirmation template is supported
   * @returns An empty result, since SMTP gives no id worth keeping
   */
  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    if (notification.template !== ORDER_CONFIRMATION_TEMPLATE) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Unknown email template: ${notification.template}`)
    }

    const {subject, html, text} = renderOrderConfirmation(notification.data as unknown as OrderConfirmationData)
    await this.transporter.sendMail({from: this.from, to: notification.to, subject, html, text})
    return {}
  }
}
