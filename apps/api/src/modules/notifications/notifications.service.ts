import { Injectable } from '@nestjs/common';
import {
  EmailDeliveryStatus,
  MessageType,
  NotificationChannel,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async myList(userId: string, pageRaw?: string, pageSizeRaw?: string, unreadOnlyRaw?: string) {
    const page = Math.max(1, Number(pageRaw ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeRaw ?? 20) || 20));
    const unreadOnly = unreadOnlyRaw === 'true';

    const where = {
      userId,
      deletedAt: null,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId, deletedAt: null },
      data: { isRead: true },
    });
    return { id };
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, deletedAt: null, isRead: false },
      data: { isRead: true },
    });
    return { affected: result.count };
  }

  async adminList(pageRaw?: string, pageSizeRaw?: string, channel?: string) {
    const page = Math.max(1, Number(pageRaw ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeRaw ?? 20) || 20));

    const normalizedChannel =
      channel === 'IN_APP' || channel === 'EMAIL' ? (channel as NotificationChannel) : null;
    const where = {
      deletedAt: null,
      ...(normalizedChannel ? { channel: normalizedChannel } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: { user: { select: { id: true, username: true, nickname: true, email: true } } },
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async adminEmailLogs(
    pageRaw?: string,
    pageSizeRaw?: string,
    status?: string,
    recipient?: string,
  ) {
    const page = Math.max(1, Number(pageRaw ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeRaw ?? 20) || 20));

    const normalizedStatus = normalizeEmailStatus(status);
    const where: Prisma.EmailDeliveryLogWhereInput = {
      deletedAt: null,
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      ...(recipient ? { recipient: { contains: recipient } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.emailDeliveryLog.findMany({
        where,
        include: {
          notification: {
            select: {
              id: true,
              userId: true,
              title: true,
              type: true,
              channel: true,
              createdAt: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.emailDeliveryLog.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async notifyCommentAuthor(input: {
    userId: string;
    recipientEmail: string | null;
    title: string;
    content: string;
    emailEnabled: boolean;
  }) {
    await this.createInApp(input.userId, 'COMMENT', input.title, input.content);

    if (!input.emailEnabled || !input.recipientEmail) return null;

    return this.createEmailAndDispatch({
      userId: input.userId,
      recipientEmail: input.recipientEmail,
      type: 'COMMENT',
      title: input.title,
      content: input.content,
    });
  }

  async notifySecurityAlert(input: {
    userId: string;
    recipientEmail: string | null;
    title: string;
    content: string;
    emailEnabled?: boolean;
  }) {
    await this.createInApp(input.userId, 'SECURITY', input.title, input.content);

    if (!input.emailEnabled || !input.recipientEmail) return null;

    return this.createEmailAndDispatch({
      userId: input.userId,
      recipientEmail: input.recipientEmail,
      type: 'SECURITY',
      title: input.title,
      content: input.content,
    });
  }

  async createInApp(userId: string, type: MessageType, title: string, content: string) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        channel: 'IN_APP',
        title,
        content,
        sentAt: new Date(),
      },
    });
  }

  async createEmailAndDispatch(input: {
    userId: string;
    recipientEmail: string;
    type: MessageType;
    title: string;
    content: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        channel: 'EMAIL',
        title: input.title,
        content: input.content,
      },
    });

    const deliveryLog = await this.prisma.emailDeliveryLog.create({
      data: {
        notificationId: notification.id,
        recipient: input.recipientEmail,
        subject: input.title,
        contentPreview: input.content.slice(0, 240),
        status: 'PENDING',
      },
    });

    const result = await this.mailService.sendWithRetry({
      to: input.recipientEmail,
      subject: input.title,
      text: input.content,
    });

    if (result.success) {
      await this.prisma.$transaction([
        this.prisma.emailDeliveryLog.update({
          where: { id: deliveryLog.id },
          data: {
            status: 'SENT',
            retries: result.retries,
            lastError: null,
            sentAt: result.sentAt,
          },
        }),
        this.prisma.notification.update({
          where: { id: notification.id },
          data: { sentAt: result.sentAt },
        }),
      ]);

      return { notificationId: notification.id, logId: deliveryLog.id, status: 'SENT' };
    }

    await this.prisma.emailDeliveryLog.update({
      where: { id: deliveryLog.id },
      data: {
        status: 'FAILED',
        retries: result.retries,
        lastError: result.lastError,
      },
    });

    return { notificationId: notification.id, logId: deliveryLog.id, status: 'FAILED' };
  }
}

function normalizeEmailStatus(value?: string): EmailDeliveryStatus | null {
  if (value === 'PENDING' || value === 'SENT' || value === 'FAILED') return value;
  return null;
}
