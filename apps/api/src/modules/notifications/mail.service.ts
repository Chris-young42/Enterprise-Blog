import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

export type SendMailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendMailResult = {
  success: boolean;
  retries: number;
  lastError: string | null;
  sentAt: Date | null;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async sendWithRetry(payload: SendMailPayload): Promise<SendMailResult> {
    const enabled = this.readBool(this.configService.get<string>('app.mailEnabled'));
    if (!enabled) {
      return {
        success: false,
        retries: 0,
        lastError: 'mail channel disabled',
        sentAt: null,
      };
    }

    const retryCount = Math.max(0, this.configService.get<number>('app.mailRetryCount') ?? 3);
    const backoffMs = Math.max(100, this.configService.get<number>('app.mailRetryBackoffMs') ?? 800);

    let retries = 0;
    let lastError: string | null = null;

    for (let attempt = 0; attempt <= retryCount; attempt += 1) {
      try {
        const transporter = this.ensureTransporter();
        const fromName = this.configService.get<string>('app.mailFromName') ?? 'Enterprise Blog';
        const fromAddress = this.configService.get<string>('app.mailFromAddress') ?? '';

        if (!fromAddress) {
          throw new Error('mail from address is empty');
        }

        await transporter.sendMail({
          from: `${fromName} <${fromAddress}>`,
          to: payload.to,
          subject: payload.subject,
          text: payload.text,
          ...(payload.html ? { html: payload.html } : {}),
        });

        return {
          success: true,
          retries,
          lastError: null,
          sentAt: new Date(),
        };
      } catch (error) {
        retries = attempt + 1;
        lastError = error instanceof Error ? error.message : 'unknown mail error';
        this.logger.warn(`mail send failed attempt=${retries}: ${lastError}`);

        if (attempt < retryCount) {
          await sleep(backoffMs * (attempt + 1));
        }
      }
    }

    return {
      success: false,
      retries,
      lastError,
      sentAt: null,
    };
  }

  private ensureTransporter() {
    if (this.transporter) return this.transporter;

    const host = this.configService.get<string>('app.mailSmtpHost') ?? '';
    const port = this.configService.get<number>('app.mailSmtpPort') ?? 587;
    const secure = this.readBool(this.configService.get<string>('app.mailSmtpSecure'));
    const user = this.configService.get<string>('app.mailSmtpUser') ?? '';
    const pass = this.configService.get<string>('app.mailSmtpPass') ?? '';

    if (!host) {
      throw new Error('mail smtp host is empty');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      ...(user ? { auth: { user, pass } } : {}),
    });

    return this.transporter;
  }

  private readBool(value?: string) {
    return value === 'true' || value === '1';
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
