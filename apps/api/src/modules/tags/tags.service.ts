import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.tag.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async aggregate() {
    const tags = await this.prisma.tag.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: {
            articles: {
              where: {
                deletedAt: null,
                article: {
                  deletedAt: null,
                  status: 'PUBLISHED',
                  visibility: 'PUBLIC',
                },
              },
            },
          },
        },
      },
      orderBy: [{ articles: { _count: 'desc' } }, { createdAt: 'desc' }],
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      articleCount: tag._count.articles,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    }));
  }

  async create(dto: CreateTagDto) {
    const data: {
      name: string;
      slug: string;
      description?: string;
    } = {
      name: dto.name,
      slug: dto.slug,
    };
    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    return this.prisma.tag.create({
      data,
    });
  }

  async update(id: string, dto: UpdateTagDto) {
    const existing = await this.prisma.tag.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('tag not found');
    }

    const data: {
      name?: string;
      slug?: string;
      description?: string;
    } = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.slug !== undefined) {
      data.slug = dto.slug;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    return this.prisma.tag.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.tag.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('tag not found');
    }

    await this.prisma.tag.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  }
}
