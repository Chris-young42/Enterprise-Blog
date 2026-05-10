import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, deletedAt: null },
        select: { id: true },
      });
      if (!parent) {
        throw new BadRequestException('parent category not found');
      }
    }

    const data: {
      parentId?: string;
      name: string;
      slug: string;
      description?: string;
      sortOrder: number;
    } = {
      name: dto.name,
      slug: dto.slug,
      sortOrder: dto.sortOrder ?? 0,
    };
    if (dto.parentId !== undefined) {
      data.parentId = dto.parentId;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    return this.prisma.category.create({
      data,
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('category not found');
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('parentId cannot be itself');
      }
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, deletedAt: null },
        select: { id: true },
      });
      if (!parent) {
        throw new BadRequestException('parent category not found');
      }
    }

    const data: {
      parentId?: string;
      name?: string;
      slug?: string;
      description?: string;
      sortOrder?: number;
    } = {};
    if (dto.parentId !== undefined) {
      data.parentId = dto.parentId;
    }
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.slug !== undefined) {
      data.slug = dto.slug;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.sortOrder !== undefined) {
      data.sortOrder = dto.sortOrder;
    }

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('category not found');
    }

    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  }
}
