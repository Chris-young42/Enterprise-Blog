import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { ListPagesDto } from './dto/list-pages.dto';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListPagesDto, isAdmin: boolean) {
    const publishedOnly = !isAdmin || query.published === 'true';
    return this.prisma.page.findMany({
      where: {
        deletedAt: null,
        ...(publishedOnly ? { isPublished: true } : {}),
        ...(query.keyword
          ? {
              OR: [
                { title: { contains: query.keyword } },
                { slug: { contains: query.keyword } },
              ],
            }
          : {}),
      },
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  async detail(slug: string, isAdmin: boolean) {
    const page = await this.prisma.page.findFirst({
      where: {
        slug,
        deletedAt: null,
        ...(isAdmin ? {} : { isPublished: true }),
      },
    });
    if (!page) throw new NotFoundException('page not found');
    return page;
  }

  async create(dto: CreatePageDto) {
    return this.prisma.page.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        content: dto.content,
        seoTitle: dto.seoTitle ?? null,
        seoDescription: dto.seoDescription ?? null,
        isPublished: dto.isPublished ?? false,
      },
    });
  }

  async update(id: string, dto: UpdatePageDto) {
    const existing = await this.prisma.page.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!existing) throw new NotFoundException('page not found');

    return this.prisma.page.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.seoTitle !== undefined ? { seoTitle: dto.seoTitle } : {}),
        ...(dto.seoDescription !== undefined ? { seoDescription: dto.seoDescription } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.page.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!existing) throw new NotFoundException('page not found');
    await this.prisma.page.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  }
}
