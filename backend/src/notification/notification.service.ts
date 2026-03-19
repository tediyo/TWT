import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendVisitNotification(ip: string, userAgent: string, page: string) {
    const to = this.configService.get<string>('NOTIFY_EMAIL');
    const from = this.configService.get<string>('SMTP_USER');

    if (!to || !from) {
      this.logger.warn('Email not configured – skipping visit notification');
      return;
    }

    const now = new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' });

    const mailOptions = {
      from: `"QA Locator Tool" <${from}>`,
      to,
      subject: `🔔 New Site Visit – ${now}`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;background:#000;color:#fff;border-radius:8px;">
          <h2 style="color:#f59e0b;margin-top:0;">New Visitor Detected</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#9ca3af;">Time</td><td style="padding:8px 0;">${now}</td></tr>
            <tr><td style="padding:8px 0;color:#9ca3af;">Page</td><td style="padding:8px 0;">${page}</td></tr>
            <tr><td style="padding:8px 0;color:#9ca3af;">IP Address</td><td style="padding:8px 0;">${ip}</td></tr>
            <tr><td style="padding:8px 0;color:#9ca3af;">Browser</td><td style="padding:8px 0;word-break:break-all;">${userAgent}</td></tr>
          </table>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Visit notification sent for IP: ${ip}`);
    } catch (error) {
      this.logger.error('Failed to send visit notification', error);
    }
  }
}
