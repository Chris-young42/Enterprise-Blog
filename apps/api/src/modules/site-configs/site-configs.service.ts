import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertSiteConfigDto } from './dto/upsert-site-config.dto';

@Injectable()
export class SiteConfigsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.siteConfig.findMany({
      where: { deletedAt: null },
      orderBy: [{ key: 'asc' }],
    });
  }

  async getByKey(key: string) {
    return this.prisma.siteConfig.findFirst({
      where: { key, deletedAt: null },
    });
  }

  async upsert(dto: UpsertSiteConfigDto) {
    const existing = await this.prisma.siteConfig.findFirst({
      where: { key: dto.key, deletedAt: null },
      select: { id: true },
    });

    if (existing) {
      return this.prisma.siteConfig.update({
        where: { id: existing.id },
        data: {
          value: dto.value as object,
          ...(dto.description !== undefined ? { description: dto.description } : {}),
        },
      });
    }

    return this.prisma.siteConfig.create({
      data: {
        key: dto.key,
        value: dto.value as object,
        description: dto.description ?? null,
      },
    });
  }

  async upsertNav(items: Array<{ label: string; href: string }>) {
    return this.upsert({
      key: 'site.nav',
      value: items,
      description: 'front site navigation items',
    });
  }

  async getNav() {
    const row = await this.getByKey('site.nav');
    if (!row) return null;
    return row.value;
  }
}
