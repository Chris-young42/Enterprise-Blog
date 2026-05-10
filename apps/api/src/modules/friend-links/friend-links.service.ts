import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFriendLinkDto } from './dto/create-friend-link.dto';
import { UpdateFriendLinkDto } from './dto/update-friend-link.dto';
import { ReviewFriendLinkDto } from './dto/review-friend-link.dto';
import { BatchReviewFriendLinksDto } from './dto/batch-review-friend-links.dto';
import { ReorderFriendLinksDto } from './dto/reorder-friend-links.dto';

@Injectable()
export class FriendLinksService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic() {
    return this.prisma.friendLink.findMany({
      where: { deletedAt: null, status: 'APPROVED' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async listAdmin() {
    return this.prisma.friendLink.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async apply(dto: CreateFriendLinkDto) {
    await this.assertApplyRateLimit(dto.url);
    const duplicated = await this.prisma.friendLink.findFirst({
      where: {
        deletedAt: null,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [{ url: dto.url }, ...(dto.email ? [{ email: dto.email }] : [])],
      },
      select: { id: true, status: true },
    });
    if (duplicated) {
      throw new HttpException('friend link already exists or pending', HttpStatus.CONFLICT);
    }

    return this.prisma.friendLink.create({
      data: {
        name: dto.name,
        url: dto.url,
        logo: dto.logo ?? null,
        description: dto.description ?? null,
        email: dto.email ?? null,
        sortOrder: dto.sortOrder ?? 0,
        status: 'PENDING',
      },
    });
  }

  async createAdmin(dto: CreateFriendLinkDto) {
    return this.prisma.friendLink.create({
      data: {
        name: dto.name,
        url: dto.url,
        logo: dto.logo ?? null,
        description: dto.description ?? null,
        email: dto.email ?? null,
        sortOrder: dto.sortOrder ?? 0,
        status: 'APPROVED',
      },
    });
  }

  async update(id: string, dto: UpdateFriendLinkDto) {
    const existing = await this.prisma.friendLink.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!existing) throw new NotFoundException('friend link not found');

    return this.prisma.friendLink.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.url !== undefined ? { url: dto.url } : {}),
        ...(dto.logo !== undefined ? { logo: dto.logo } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
  }

  async review(id: string, dto: ReviewFriendLinkDto) {
    const existing = await this.prisma.friendLink.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!existing) throw new NotFoundException('friend link not found');

    return this.prisma.friendLink.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async batchReview(dto: BatchReviewFriendLinksDto) {
    if (dto.ids.length === 0) return { affected: 0 };
    const result = await this.prisma.friendLink.updateMany({
      where: { id: { in: dto.ids }, deletedAt: null },
      data: { status: dto.status },
    });
    return { affected: result.count };
  }

  async remove(id: string) {
    const existing = await this.prisma.friendLink.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!existing) throw new NotFoundException('friend link not found');

    await this.prisma.friendLink.update({ where: { id }, data: { deletedAt: new Date() } });
    return { id };
  }

  async reorder(dto: ReorderFriendLinksDto) {
    if (dto.ids.length === 0) return { affected: 0 };
    const rows = await this.prisma.friendLink.findMany({
      where: { id: { in: dto.ids }, deletedAt: null },
      select: { id: true },
    });
    if (rows.length === 0) return { affected: 0 };
    const existingIds = new Set(rows.map((row) => row.id));
    const orderedIds = dto.ids.filter((id) => existingIds.has(id));
    if (orderedIds.length === 0) return { affected: 0 };

    const result = await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.friendLink.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    return { affected: result.length };
  }

  private async assertApplyRateLimit(url: string) {
    const since = new Date(Date.now() - 10 * 60 * 1000);
    const recentCount = await this.prisma.friendLink.count({
      where: {
        deletedAt: null,
        url,
        createdAt: { gte: since },
      },
    });
    if (recentCount > 0) {
      throw new HttpException('apply too frequent, try later', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
