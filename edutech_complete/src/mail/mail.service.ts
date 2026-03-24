import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import * as nodemailer from 'nodemailer'

@Injectable()
export class MailService {
  private readonly mailUser = process.env.EMAIL_USER || process.env.SMTP_USER
  private readonly mailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS
  private readonly mailFrom =
    process.env.MAIL_FROM ||
    process.env.EMAIL_USER ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    'no-reply@algoaliens.local'

  private readonly frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '')

  private readonly transporter = nodemailer.createTransport(
    process.env.SMTP_SERVICE
      ? {
          service: process.env.SMTP_SERVICE,
          auth:
            this.mailUser && this.mailPass
              ? {
                  user: this.mailUser,
                  pass: this.mailPass,
                }
              : undefined,
        }
      : {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT || 587),
          secure: String(process.env.SMTP_SECURE || 'false') === 'true',
          auth:
            this.mailUser && this.mailPass
              ? {
                  user: this.mailUser,
                  pass: this.mailPass,
                }
              : undefined,
        },
  )

  async sendResetEmail(email: string, token: string) {
    const resetUrl = `${this.frontendUrl}/reset-password/${token}`

    if (!this.mailUser || !this.mailPass) {
      throw new ServiceUnavailableException('Email service is not configured')
    }

    await this.transporter.sendMail({
      from: this.mailFrom,
      to: email,
      subject: 'Reset your AlgoAliens password',
      text: `Use this link to reset your password: ${resetUrl}. This link expires in 15 minutes.`,
      html: `<p>Use this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 15 minutes.</p>`,
    })
  }
}
