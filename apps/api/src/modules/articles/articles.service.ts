import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArticleStatus, ContentVisibility, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ListArticlesDto } from './dto/list-articles.dto';
import { BatchMoveCategoryDto } from './dto/batch-move-category.dto';
import { BatchToggleDto } from './dto/batch-toggle.dto';
import { BatchIdsDto } from './dto/batch-ids.dto';
import { BatchStatusDto } from './dto/batch-status.dto';
import { BatchMoveSeriesDto } from './dto/batch-move-series.dto';
import { BatchVisibilityDto } from './dto/batch-visibility.dto';
import { AssignArticleDto } from './dto/assign-article.dto';
import { ListAssignmentsDto } from './dto/list-assignments.dto';

type RequestUser = {
  sub: string;
  roleCodes: string[];
};

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: RequestUser, dto: CreateArticleDto) {
    await this.assertAuthoringAccess(user, dto.visibility);
    await this.assertTaxonomyExists(dto.categoryId, dto.seriesId, dto.tagIds);

    const wordCount = countWords(dto.contentMarkdown);
    const readingMinutes = estimateReadingMinutes(wordCount);
    const accessPasswordHash =
      dto.visibility === 'PASSWORD' && dto.accessPassword
        ? await bcrypt.hash(dto.accessPassword, 12)
        : null;

    const data: Prisma.ArticleCreateInput = {
      title: dto.title,
      slug: dto.slug,
      summary: dto.summary ?? null,
      contentMarkdown: dto.contentMarkdown,
      contentHtml: dto.contentHtml ?? null,
      seoTitle: dto.seoTitle ?? null,
      seoDescription: dto.seoDescription ?? null,
      status: dto.status ?? inferStatusFromSchedule(dto.scheduledAt),
      origin: dto.origin ?? 'ORIGINAL',
      visibility: dto.visibility ?? 'PUBLIC',
      accessPasswordHash,
      isPinned: dto.isPinned ?? false,
      isRecommended: dto.isRecommended ?? false,
      publishAt: dto.publishAt ? new Date(dto.publishAt) : null,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      wordCount,
      readingMinutes,
      author: { connect: { id: user.sub } },
    };

    if (dto.categoryId) {
      data.category = { connect: { id: dto.categoryId } };
    }
    if (dto.seriesId) {
      data.series = { connect: { id: dto.seriesId } };
    }
    if (dto.tagIds && dto.tagIds.length > 0) {
      data.tags = {
        create: dto.tagIds.map((tagId) => ({
          tag: { connect: { id: tagId } },
        })),
      };
    }

    const created = await this.prisma.article.create({
      data,
      include: articleInclude(),
    });

    return mapArticle(created);
  }

  async update(user: RequestUser, id: string, dto: UpdateArticleDto) {
    const article = await this.requireOwnedArticleOrPrivileged(user, id);
    await this.assertAuthoringAccess(user, dto.visibility ?? article.visibility);
    await this.assertTaxonomyExists(dto.categoryId, dto.seriesId, dto.tagIds);

    const data: Prisma.ArticleUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.summary !== undefined) data.summary = dto.summary;
    if (dto.contentMarkdown !== undefined) {
      data.contentMarkdown = dto.contentMarkdown;
      const wordCount = countWords(dto.contentMarkdown);
      data.wordCount = wordCount;
      data.readingMinutes = estimateReadingMinutes(wordCount);
    }
    if (dto.contentHtml !== undefined) data.contentHtml = dto.contentHtml;
    if (dto.seoTitle !== undefined) data.seoTitle = dto.seoTitle;
    if (dto.seoDescription !== undefined) data.seoDescription = dto.seoDescription;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.origin !== undefined) data.origin = dto.origin;
    if (dto.visibility !== undefined) data.visibility = dto.visibility;
    if (dto.isPinned !== undefined) data.isPinned = dto.isPinned;
    if (dto.isRecommended !== undefined) data.isRecommended = dto.isRecommended;
    if (dto.publishAt !== undefined) data.publishAt = dto.publishAt ? new Date(dto.publishAt) : null;
    if (dto.scheduledAt !== undefined) {
      data.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
      if (dto.status === undefined) {
        data.status = inferStatusFromSchedule(dto.scheduledAt);
      }
    }
    if (dto.categoryId !== undefined) {
      data.category = dto.categoryId
        ? { connect: { id: dto.categoryId } }
        : { disconnect: true };
    }
    if (dto.seriesId !== undefined) {
      data.series = dto.seriesId ? { connect: { id: dto.seriesId } } : { disconnect: true };
    }
    if (dto.tagIds !== undefined) {
      data.tags = {
        deleteMany: {},
        create: dto.tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
      };
    }
    if (dto.visibility === 'PASSWORD' && dto.accessPassword) {
      data.accessPasswordHash = await bcrypt.hash(dto.accessPassword, 12);
    }
    if (dto.visibility !== 'PASSWORD') {
      data.accessPasswordHash = null;
    }

    const updated = await this.prisma.article.update({
      where: { id },
      data,
      include: articleInclude(),
    });

    return mapArticle(updated);
  }

  async list(user: RequestUser | null, dto: ListArticlesDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;

    const where: Prisma.ArticleWhereInput = {
      deletedAt: null,
      ...buildVisibilityWhere(user),
    };
    if (dto.keyword) {
      where.OR = [
        { title: { contains: dto.keyword } },
        { contentMarkdown: { contains: dto.keyword } },
        { tags: { some: { tag: { name: { contains: dto.keyword } } } } },
      ];
    }
    if (dto.tagId) {
      where.tags = { some: { tagId: dto.tagId } };
    }
    if (dto.categoryId) {
      where.categoryId = dto.categoryId;
    }
    if (dto.status) {
      where.status = dto.status;
    }
    if (dto.year) {
      const year = Number(dto.year);
      if (!Number.isNaN(year)) {
        const from = new Date(year, 0, 1);
        const to = new Date(year + 1, 0, 1);
        where.publishAt = { gte: from, lt: to };
      }
    }
    if (dto.month && dto.year) {
      const year = Number(dto.year);
      const month = Number(dto.month);
      if (!Number.isNaN(year) && !Number.isNaN(month) && month >= 1 && month <= 12) {
        const from = new Date(year, month - 1, 1);
        const to = new Date(year, month, 1);
        where.publishAt = { gte: from, lt: to };
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: articleInclude(),
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ isPinned: 'desc' }, { publishAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      items: items.map(mapArticle),
      total,
      page,
      pageSize,
    };
  }

  async hot(limit = 10) {
    const rows = await this.prisma.article.findMany({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      },
      include: articleInclude(),
      take: limit,
      orderBy: [{ views: 'desc' }, { likes: 'desc' }, { favorites: 'desc' }, { publishAt: 'desc' }],
    });
    return rows.map(mapArticle);
  }

  async detail(user: RequestUser | null, slug: string, password?: string) {
    const article = await this.prisma.article.findFirst({
      where: { slug, deletedAt: null },
      include: articleInclude(),
    });
    if (!article) {
      throw new NotFoundException('article not found');
    }

    await this.assertReadableArticle(article, user, password);
    await this.prisma.article.update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
    });

    return mapArticle(article);
  }

  async saveDraft(user: RequestUser, id: string, dto: UpdateArticleDto) {
    return this.update(user, id, { ...dto, status: 'DRAFT' });
  }

  async schedule(user: RequestUser, id: string, scheduledAt: string) {
    return this.update(user, id, { scheduledAt, status: 'SCHEDULED' });
  }

  async publish(user: RequestUser, id: string) {
    return this.update(user, id, { status: 'PUBLISHED', publishAt: new Date().toISOString() });
  }

  async archive() {
    const rows = await this.prisma.article.findMany({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        publishAt: { not: null },
        visibility: 'PUBLIC',
      },
      select: { id: true, title: true, slug: true, publishAt: true },
      orderBy: { publishAt: 'desc' },
    });

    const grouped = new Map<string, Map<string, Array<{ id: string; title: string; slug: string; date: string }>>>();
    for (const row of rows) {
      if (!row.publishAt) continue;
      const year = `${row.publishAt.getFullYear()}`;
      const month = `${row.publishAt.getMonth() + 1}`.padStart(2, '0');
      const list = grouped.get(year) ?? new Map();
      const monthList = list.get(month) ?? [];
      monthList.push({
        id: row.id,
        title: row.title,
        slug: row.slug,
        date: row.publishAt.toISOString(),
      });
      list.set(month, monthList);
      grouped.set(year, list);
    }

    return Array.from(grouped.entries()).map(([year, months]) => ({
      year,
      months: Array.from(months.entries()).map(([month, items]) => ({ month, items })),
    }));
  }

  async remove(user: RequestUser, id: string) {
    await this.requireOwnedArticleOrPrivileged(user, id);
    await this.prisma.article.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  }

  async batchDelete(user: RequestUser, dto: BatchIdsDto) {
    await this.assertBatchOwnershipOrPrivileged(user, dto.ids);
    const result = await this.prisma.article.updateMany({
      where: { id: { in: dto.ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { affected: result.count };
  }

  async batchSetPinned(user: RequestUser, dto: BatchToggleDto) {
    await this.assertBatchOwnershipOrPrivileged(user, dto.ids);
    const result = await this.prisma.article.updateMany({
      where: { id: { in: dto.ids }, deletedAt: null },
      data: { isPinned: dto.value },
    });
    return { affected: result.count };
  }

  async batchSetRecommended(user: RequestUser, dto: BatchToggleDto) {
    await this.assertBatchOwnershipOrPrivileged(user, dto.ids);
    const result = await this.prisma.article.updateMany({
      where: { id: { in: dto.ids }, deletedAt: null },
      data: { isRecommended: dto.value },
    });
    return { affected: result.count };
  }

  async batchMoveCategory(user: RequestUser, dto: BatchMoveCategoryDto) {
    await this.assertBatchOwnershipOrPrivileged(user, dto.ids);
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, deletedAt: null },
        select: { id: true },
      });
      if (!category) {
        throw new BadRequestException('category not found');
      }
    }

    const result = await this.prisma.article.updateMany({
      where: { id: { in: dto.ids }, deletedAt: null },
      data: {
        categoryId: dto.categoryId ?? null,
      },
    });
    return { affected: result.count };
  }

  async batchSetStatus(user: RequestUser, dto: BatchStatusDto) {
    await this.assertBatchOwnershipOrPrivileged(user, dto.ids);

    const data: Prisma.ArticleUpdateManyMutationInput = {
      status: dto.status,
      ...(dto.status === 'PUBLISHED'
        ? { publishAt: new Date(), scheduledAt: null }
        : dto.status === 'SCHEDULED'
          ? { scheduledAt: new Date(Date.now() + 10 * 60 * 1000) }
          : {}),
    };

    const result = await this.prisma.article.updateMany({
      where: { id: { in: dto.ids }, deletedAt: null },
      data,
    });
    return { affected: result.count };
  }

  async batchMoveSeries(user: RequestUser, dto: BatchMoveSeriesDto) {
    await this.assertBatchOwnershipOrPrivileged(user, dto.ids);
    if (dto.seriesId) {
      const series = await this.prisma.series.findFirst({
        where: { id: dto.seriesId, deletedAt: null },
        select: { id: true },
      });
      if (!series) throw new BadRequestException('series not found');
    }

    const result = await this.prisma.article.updateMany({
      where: { id: { in: dto.ids }, deletedAt: null },
      data: { seriesId: dto.seriesId ?? null },
    });
    return { affected: result.count };
  }

  async batchSetVisibility(user: RequestUser, dto: BatchVisibilityDto) {
    await this.assertBatchOwnershipOrPrivileged(user, dto.ids);

    const result = await this.prisma.article.updateMany({
      where: { id: { in: dto.ids }, deletedAt: null },
      data: {
        visibility: dto.visibility,
        ...(dto.visibility === 'PASSWORD' ? {} : { accessPasswordHash: null }),
      },
    });
    return { affected: result.count };
  }

  async assignArticle(user: RequestUser, articleId: string, dto: AssignArticleDto) {
    const article = await this.prisma.article.findFirst({
      where: { id: articleId, deletedAt: null },
      select: { id: true },
    });
    if (!article) throw new NotFoundException('article not found');

    const assignee = await this.prisma.user.findFirst({
      where: { id: dto.assigneeId, deletedAt: null },
      select: { id: true },
    });
    if (!assignee) throw new BadRequestException('assignee not found');

    const existing = await this.prisma.articleAssignment.findFirst({
      where: { articleId, assigneeId: dto.assigneeId, deletedAt: null },
      select: { id: true },
    });

    if (existing) {
      const updated = await this.prisma.articleAssignment.update({
        where: { id: existing.id },
        data: {
          note: dto.note ?? null,
          dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
          status: dto.status ?? 'TODO',
          assignerId: user.sub,
        },
        include: assignmentInclude(),
      });
      return mapAssignment(updated);
    }

    const created = await this.prisma.articleAssignment.create({
      data: {
        articleId,
        assigneeId: dto.assigneeId,
        assignerId: user.sub,
        note: dto.note ?? null,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        status: dto.status ?? 'TODO',
      },
      include: assignmentInclude(),
    });
    return mapAssignment(created);
  }

  async listAssignments(user: RequestUser, query: ListAssignmentsDto) {
    const privileged = hasPrivilegedRole(user.roleCodes);
    const where: Prisma.ArticleAssignmentWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(!privileged ? { assigneeId: user.sub } : {}),
    };

    const rows = await this.prisma.articleAssignment.findMany({
      where,
      include: assignmentInclude(),
      orderBy: [{ createdAt: 'desc' }],
    });

    return { items: rows.map(mapAssignment) };
  }

  private async assertTaxonomyExists(categoryId?: string, seriesId?: string, tagIds?: string[]) {
    if (categoryId) {
      const exists = await this.prisma.category.findFirst({
        where: { id: categoryId, deletedAt: null },
        select: { id: true },
      });
      if (!exists) throw new BadRequestException('category not found');
    }
    if (seriesId) {
      const exists = await this.prisma.series.findFirst({
        where: { id: seriesId, deletedAt: null },
        select: { id: true },
      });
      if (!exists) throw new BadRequestException('series not found');
    }
    if (tagIds && tagIds.length > 0) {
      const count = await this.prisma.tag.count({
        where: { id: { in: tagIds }, deletedAt: null },
      });
      if (count !== tagIds.length) throw new BadRequestException('some tags not found');
    }
  }

  private async requireOwnedArticleOrPrivileged(user: RequestUser, id: string) {
    const article = await this.prisma.article.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, authorId: true, visibility: true },
    });
    if (!article) {
      throw new NotFoundException('article not found');
    }

    const privileged = user.roleCodes.some((role) =>
      ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(role),
    );
    if (!privileged && article.authorId !== user.sub) {
      throw new ForbiddenException('cannot edit other author article');
    }
    return article;
  }

  private async assertBatchOwnershipOrPrivileged(user: RequestUser, ids: string[]) {
    const privileged = hasPrivilegedRole(user.roleCodes);
    if (privileged) return;

    const rows = await this.prisma.article.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true, authorId: true },
    });
    if (rows.length !== ids.length) {
      throw new NotFoundException('some articles not found');
    }
    const invalid = rows.some((row) => row.authorId !== user.sub);
    if (invalid) {
      throw new ForbiddenException('cannot batch manage articles of other authors');
    }
  }

  private async assertAuthoringAccess(user: RequestUser, visibility?: ContentVisibility) {
    if (visibility === 'FOLLOWER') {
      const can = user.roleCodes.some((role) =>
        ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'].includes(role),
      );
      if (!can) {
        throw new ForbiddenException('insufficient role for follower-only visibility');
      }
    }
  }

  private async assertReadableArticle(
    article: {
      status: ArticleStatus;
      visibility: ContentVisibility;
      authorId: string;
      accessPasswordHash: string | null;
    },
    user: RequestUser | null,
    password?: string,
  ) {
    if (article.status !== 'PUBLISHED') {
      const canReadDraft = user?.sub === article.authorId || hasPrivilegedRole(user?.roleCodes);
      if (!canReadDraft) {
        throw new ForbiddenException('article is not published');
      }
    }

    if (article.visibility === 'PUBLIC') return;
    if (article.visibility === 'LOGGED_IN' && user) return;
    if (article.visibility === 'PRIVATE' && user?.sub === article.authorId) return;
    if (article.visibility === 'FOLLOWER' && user) return;
    if (article.visibility === 'PASSWORD') {
      if (!article.accessPasswordHash) throw new ForbiddenException('password missing');
      if (!password) throw new ForbiddenException('password required');
      const matched = await bcrypt.compare(password, article.accessPasswordHash);
      if (!matched) throw new ForbiddenException('invalid password');
      return;
    }

    throw new ForbiddenException('article is not visible to current user');
  }
}

function inferStatusFromSchedule(scheduledAt?: string): ArticleStatus {
  if (!scheduledAt) return 'DRAFT';
  return 'SCHEDULED';
}

function countWords(content: string): number {
  const plain = content.replace(/[#>*`~\-[\]()!]/g, ' ').trim();
  if (!plain) return 0;
  return plain.split(/\s+/).length;
}

function estimateReadingMinutes(wordCount: number): number {
  if (wordCount <= 0) return 0;
  return Math.max(1, Math.ceil(wordCount / 220));
}

function hasPrivilegedRole(roles?: string[]) {
  if (!roles) return false;
  return roles.some((role) => ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(role));
}

function buildVisibilityWhere(user: RequestUser | null): Prisma.ArticleWhereInput {
  if (!user) {
    return {
      OR: [{ visibility: 'PUBLIC' }],
      status: 'PUBLISHED',
    };
  }

  const userRoleCodes = user.roleCodes as string[];
  if (hasPrivilegedRole(userRoleCodes)) {
    return {};
  }

  return {
    OR: [
      { visibility: 'PUBLIC', status: 'PUBLISHED' },
      { visibility: 'LOGGED_IN', status: 'PUBLISHED' },
      { visibility: 'FOLLOWER', status: 'PUBLISHED' },
      { visibility: 'PASSWORD', status: 'PUBLISHED' },
      { visibility: 'PRIVATE', authorId: user.sub },
      { authorId: user.sub },
    ],
  };
}

function articleInclude() {
  return {
    category: true,
    series: true,
    author: {
      select: {
        id: true,
        username: true,
        nickname: true,
      },
    },
    tags: {
      where: { deletedAt: null },
      include: { tag: true },
    },
  } satisfies Prisma.ArticleInclude;
}

function assignmentInclude() {
  return {
    article: {
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
      },
    },
    assignee: {
      select: {
        id: true,
        username: true,
        nickname: true,
      },
    },
    assigner: {
      select: {
        id: true,
        username: true,
        nickname: true,
      },
    },
  } satisfies Prisma.ArticleAssignmentInclude;
}

function mapArticle(article: Prisma.ArticleGetPayload<{ include: ReturnType<typeof articleInclude> }>) {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    contentMarkdown: article.contentMarkdown,
    contentHtml: article.contentHtml,
    status: article.status,
    origin: article.origin,
    visibility: article.visibility,
    isPinned: article.isPinned,
    isRecommended: article.isRecommended,
    publishAt: article.publishAt,
    scheduledAt: article.scheduledAt,
    views: article.views,
    likes: article.likes,
    favorites: article.favorites,
    commentCount: article.commentCount,
    wordCount: article.wordCount,
    readingMinutes: article.readingMinutes,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    author: article.author,
    category: article.category,
    series: article.series,
    tags: article.tags.map((item) => ({
      id: item.tag.id,
      name: item.tag.name,
      slug: item.tag.slug,
    })),
  };
}

function mapAssignment(
  row: Prisma.ArticleAssignmentGetPayload<{ include: ReturnType<typeof assignmentInclude> }>,
) {
  return {
    id: row.id,
    articleId: row.articleId,
    assigneeId: row.assigneeId,
    assignerId: row.assignerId,
    status: row.status,
    note: row.note,
    dueAt: row.dueAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    article: {
      id: row.article.id,
      title: row.article.title,
      slug: row.article.slug,
      status: row.article.status,
    },
    assignee: {
      id: row.assignee.id,
      username: row.assignee.username,
      nickname: row.assignee.nickname,
    },
    assigner: row.assigner
      ? {
          id: row.assigner.id,
          username: row.assigner.username,
          nickname: row.assigner.nickname,
        }
      : null,
  };
}
