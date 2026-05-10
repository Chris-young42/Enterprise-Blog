import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic() {
    const now = new Date();
    return this.prisma.announcement.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        AND: [
          {
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          },
          {
            OR: [{ endsAt: null }, { endsAt: { gte: now } }],
          },
        ],
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 10,
    });
  }

  async listAdmin() {
    return this.prisma.announcement.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async create(dto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        isPopup: dto.isPopup ?? false,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateAnnouncementDto) {
    const existing = await this.prisma.announcement.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!existing) throw new NotFoundException('announcement not found');

    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.startsAt !== undefined ? { startsAt: dto.startsAt ? new Date(dto.startsAt) : null } : {}),
        ...(dto.endsAt !== undefined ? { endsAt: dto.endsAt ? new Date(dto.endsAt) : null } : {}),
        ...(dto.isPopup !== undefined ? { isPopup: dto.isPopup } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.announcement.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!existing) throw new NotFoundException('announcement not found');

    await this.prisma.announcement.update({ where: { id }, data: { deletedAt: new Date() } });
    return { id };
  }
}
