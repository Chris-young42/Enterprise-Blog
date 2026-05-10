import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSensitiveWordDto } from './dto/create-sensitive-word.dto';
import { UpdateSensitiveWordDto } from './dto/update-sensitive-word.dto';

@Injectable()
export class SensitiveWordsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query?: { keyword?: string; isEnabled?: string }) {
    const keyword = query?.keyword?.trim();
    const isEnabled =
      query?.isEnabled === 'true'
        ? true
        : query?.isEnabled === 'false'
          ? false
          : null;

    return this.prisma.sensitiveWord.findMany({
      where: {
        deletedAt: null,
        ...(keyword ? { keyword: { contains: keyword } } : {}),
        ...(isEnabled === null ? {} : { isEnabled }),
      },
      orderBy: [{ isEnabled: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(dto: CreateSensitiveWordDto) {
    return this.prisma.sensitiveWord.create({
      data: {
        keyword: dto.keyword.trim(),
        level: dto.level ?? 'BLOCK',
        replaceWith: dto.replaceWith?.trim() || null,
        isEnabled: dto.isEnabled ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateSensitiveWordDto) {
    const existing = await this.prisma.sensitiveWord.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('sensitive word not found');

    return this.prisma.sensitiveWord.update({
      where: { id },
      data: {
        ...(dto.keyword !== undefined ? { keyword: dto.keyword.trim() } : {}),
        ...(dto.level !== undefined ? { level: dto.level } : {}),
        ...(dto.replaceWith !== undefined ? { replaceWith: dto.replaceWith.trim() || null } : {}),
        ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.sensitiveWord.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('sensitive word not found');

    await this.prisma.sensitiveWord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  }

  async readEnabledWords() {
    const rows = await this.prisma.sensitiveWord.findMany({
      where: { deletedAt: null, isEnabled: true },
      select: { keyword: true },
    });
    return rows.map((row) => row.keyword.trim()).filter((item) => item.length > 0);
  }
}