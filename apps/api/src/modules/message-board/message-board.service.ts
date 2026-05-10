import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageBoardDto } from './dto/create-message-board.dto';
import { ReviewMessageBoardDto } from './dto/review-message-board.dto';
import { BatchReviewMessageBoardDto } from './dto/batch-review-message-board.dto';
import { BatchRemoveMessageBoardDto } from './dto/batch-remove-message-board.dto';
import { ListMessageBoardDto } from './dto/list-message-board.dto';

type AuthUser = {
  sub: string;
};

@Injectable()
export class MessageBoardService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(query: ListMessageBoardDto) {
    const pageRaw = Number(query.page ?? 1);
    const pageSizeRaw = Number(query.pageSize ?? 20);
    const page = Number.isNaN(pageRaw) ? 1 : Math.max(1, pageRaw);
    const pageSize = Number.isNaN(pageSizeRaw) ? 20 : Math.min(100, Math.max(1, pageSizeRaw));
    const sort = query.sort === 'oldest' ? 'oldest' : 'latest';
    const where = { deletedAt: null, status: ReviewStatus.APPROVED };

    const [items, total] = await Promise.all([
      this.prisma.messageBoard.findMany({
        where,
        orderBy: [{ createdAt: sort === 'oldest' ? 'asc' : 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.messageBoard.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async listAdmin(query: ListMessageBoardDto) {
    const policyWords = await this.readSensitiveWords();
    const status = query.status;
    const isAnonymousFilter =
      query.isAnonymous === 'true'
        ? true
        : query.isAnonymous === 'false'
          ? false
          : null;

    const rows = await this.prisma.messageBoard.findMany({
      where: {
        deletedAt: null,
        ...(status && Object.values(ReviewStatus).includes(status as ReviewStatus)
          ? { status: status as ReviewStatus }
          : {}),
        ...(isAnonymousFilter === null ? {} : { isAnonymous: isAnonymousFilter }),
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return rows.map((row) => ({
      ...row,
      sensitiveHits: collectSensitiveHits(row.content, policyWords),
    }));
  }

  async create(user: AuthUser | null, dto: CreateMessageBoardDto) {
    return this.prisma.messageBoard.create({
      data: {
        userId: user?.sub ?? null,
        content: dto.content,
        isAnonymous: dto.isAnonymous ?? true,
        status: ReviewStatus.PENDING,
      },
    });
  }

  async review(id: string, dto: ReviewMessageBoardDto) {
    const existing = await this.prisma.messageBoard.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!existing) throw new NotFoundException('message not found');
    return this.prisma.messageBoard.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async batchReview(dto: BatchReviewMessageBoardDto) {
    if (dto.ids.length === 0) return { affected: 0 };
    const result = await this.prisma.messageBoard.updateMany({
      where: { id: { in: dto.ids }, deletedAt: null },
      data: { status: dto.status },
    });
    return { affected: result.count };
  }

  async remove(id: string) {
    const existing = await this.prisma.messageBoard.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!existing) throw new NotFoundException('message not found');
    await this.prisma.messageBoard.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  }

  async batchRemove(dto: BatchRemoveMessageBoardDto) {
    if (dto.ids.length === 0) return { affected: 0 };
    const result = await this.prisma.messageBoard.updateMany({
      where: { id: { in: dto.ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { affected: result.count };
  }

  private async readSensitiveWords() {
    const row = await this.prisma.siteConfig.findFirst({
      where: { key: 'comment_policy', deletedAt: null },
      select: { value: true },
    });
    if (!row) return [];
    const value = row.value as { sensitiveWords?: unknown };
    if (!Array.isArray(value.sensitiveWords)) return [];
    return value.sensitiveWords.filter((item): item is string => typeof item === 'string');
  }
}

function collectSensitiveHits(content: string, words: string[]) {
  if (words.length === 0) return [] as string[];
  const lower = content.toLowerCase();
  return words
    .filter((word) => word.trim().length > 0)
    .filter((word) => lower.includes(word.toLowerCase()));
}
