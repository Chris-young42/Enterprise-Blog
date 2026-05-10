import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMomentDto } from './dto/create-moment.dto';
import { UpdateMomentDto } from './dto/update-moment.dto';
import { ListMomentsDto } from './dto/list-moments.dto';

type AuthUser = {
  sub: string;
  roleCodes: string[];
};

@Injectable()
export class MomentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListMomentsDto, isAdmin: boolean) {
    const publishedOnly = !isAdmin || query.published === 'true';
    const rows = await this.prisma.page.findMany({
      where: {
        deletedAt: null,
        slug: { startsWith: 'moment-' },
        ...(publishedOnly ? { isPublished: true } : {}),
        ...(query.keyword
          ? {
              OR: [
                { title: { contains: query.keyword } },
                { content: { contains: query.keyword } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }],
    });
    return rows.map(mapMoment);
  }

  async timeline() {
    const rows = await this.prisma.page.findMany({
      where: {
        deletedAt: null,
        slug: { startsWith: 'moment-' },
        isPublished: true,
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    const mapped = rows.map(mapMoment);
    const grouped = new Map<string, Array<ReturnType<typeof mapMoment>>>();

    for (const item of mapped) {
      const date = new Date(item.createdAt);
      const year = String(date.getFullYear());
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      const list = grouped.get(key) ?? [];
      list.push(item);
      grouped.set(key, list);
    }

    return Array.from(grouped.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, items]) => ({
        date,
        items,
      }));
  }

  async detail(slug: string, isAdmin: boolean) {
    const row = await this.prisma.page.findFirst({
      where: {
        slug,
        deletedAt: null,
        ...(isAdmin ? {} : { isPublished: true }),
      },
    });
    if (!row || !row.slug.startsWith('moment-')) {
      throw new NotFoundException('moment not found');
    }
    return mapMoment(row);
  }

  async create(user: AuthUser, dto: CreateMomentDto) {
    const slugBase = dto.slug?.trim() || `moment-${Date.now()}`;
    const slug = slugBase.startsWith('moment-') ? slugBase : `moment-${slugBase}`;
    const title = dto.title?.trim() || '随笔记录';

    const created = await this.prisma.page.create({
      data: {
        title,
        slug,
        content: dto.content,
        seoTitle: title,
        seoDescription: dto.summary ?? null,
        isPublished: dto.isPublished ?? true,
      },
    });

    return {
      ...mapMoment(created),
      authorId: user.sub,
    };
  }

  async update(id: string, dto: UpdateMomentDto) {
    const row = await this.prisma.page.findFirst({ where: { id, deletedAt: null }, select: { id: true, slug: true } });
    if (!row || !row.slug.startsWith('moment-')) {
      throw new NotFoundException('moment not found');
    }

    const updated = await this.prisma.page.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.summary !== undefined ? { seoDescription: dto.summary } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
      },
    });

    return mapMoment(updated);
  }

  async remove(id: string) {
    const row = await this.prisma.page.findFirst({ where: { id, deletedAt: null }, select: { id: true, slug: true } });
    if (!row || !row.slug.startsWith('moment-')) {
      throw new NotFoundException('moment not found');
    }
    await this.prisma.page.update({ where: { id }, data: { deletedAt: new Date() } });
    return { id };
  }
}

function mapMoment(row: {
  id: string;
  title: string;
  slug: string;
  content: string;
  seoDescription: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    summary: row.seoDescription,
    isPublished: row.isPublished,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
