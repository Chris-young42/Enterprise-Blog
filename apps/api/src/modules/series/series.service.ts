import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';

@Injectable()
export class SeriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.series.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(dto: CreateSeriesDto) {
    const data: {
      title: string;
      slug: string;
      description?: string;
      coverUrl?: string;
      sortOrder: number;
    } = {
      title: dto.title,
      slug: dto.slug,
      sortOrder: dto.sortOrder ?? 0,
    };
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.coverUrl !== undefined) {
      data.coverUrl = dto.coverUrl;
    }

    return this.prisma.series.create({
      data,
    });
  }

  async update(id: string, dto: UpdateSeriesDto) {
    const existing = await this.prisma.series.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('series not found');
    }

    const data: {
      title?: string;
      slug?: string;
      description?: string;
      coverUrl?: string;
      sortOrder?: number;
    } = {};
    if (dto.title !== undefined) {
      data.title = dto.title;
    }
    if (dto.slug !== undefined) {
      data.slug = dto.slug;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.coverUrl !== undefined) {
      data.coverUrl = dto.coverUrl;
    }
    if (dto.sortOrder !== undefined) {
      data.sortOrder = dto.sortOrder;
    }

    return this.prisma.series.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.series.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('series not found');
    }

    await this.prisma.series.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  }
}
