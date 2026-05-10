import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, ReviewStatus } from '@prisma/client';
import { createHmac, randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SensitiveWordsService } from '../sensitive-words/sensitive-words.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SecurityService } from '../security/security.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsDto } from './dto/list-comments.dto';
import { ReviewCommentDto } from './dto/review-comment.dto';
import { UpdateCommentPolicyDto } from './dto/update-comment-policy.dto';

type RequestUser = {
  sub: string;
  username: string;
  roleCodes: string[];
};

type RequestContext = {
  ip?: string;
};

type CommentPolicy = {
  guestCommentEnabled: boolean;
  autoReviewEnabled: boolean;
  reviewMode: 'MANUAL' | 'MIXED';
  sensitiveWords: string[];
  blockedUserIds: string[];
  captchaRequired: boolean;
  commentCooldownSeconds: number;
  commentMaxPerHour: number;
  emailNotificationEnabled: boolean;
};

type CaptchaChallenge = {
  question: string;
  token: string;
  expiresAt: string;
};

const COMMENT_POLICY_KEY = 'comment_policy';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly sensitiveWordsService: SensitiveWordsService,
    private readonly notificationsService: NotificationsService,
    private readonly securityService: SecurityService,
  ) {}

  async getPolicy() {
    return this.readPolicy();
  }

  async getPublicPolicy() {
    const policy = await this.readPolicy();
    return {
      guestCommentEnabled: policy.guestCommentEnabled,
      captchaRequired: policy.captchaRequired,
      commentCooldownSeconds: policy.commentCooldownSeconds,
    };
  }

  async createCaptcha(): Promise<CaptchaChallenge> {
    const secret = this.getCaptchaSecret();
    const left = randomInt(2, 10);
    const right = randomInt(1, 10);
    const answer = `${left + right}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const payload = {
      answerHash: signValue(answer, secret),
      expiresAt: expiresAt.toISOString(),
    };
    return {
      question: `${left} + ${right} = ?`,
      token: signPayload(payload, secret),
      expiresAt: payload.expiresAt,
    };
  }

  async updatePolicy(dto: UpdateCommentPolicyDto) {
    const current = await this.readPolicy();
    const next: CommentPolicy = {
      guestCommentEnabled: dto.guestCommentEnabled ?? current.guestCommentEnabled,
      autoReviewEnabled: dto.autoReviewEnabled ?? current.autoReviewEnabled,
      reviewMode: dto.reviewMode ?? current.reviewMode,
      sensitiveWords:
        dto.sensitiveWords?.map((item) => item.trim()).filter((item) => item.length > 0) ??
        current.sensitiveWords,
      blockedUserIds:
        dto.blockedUserIds?.map((item) => item.trim()).filter((item) => item.length > 0) ??
        current.blockedUserIds,
      captchaRequired: dto.captchaRequired ?? current.captchaRequired,
      commentCooldownSeconds: dto.commentCooldownSeconds ?? current.commentCooldownSeconds,
      commentMaxPerHour: dto.commentMaxPerHour ?? current.commentMaxPerHour,
      emailNotificationEnabled:
        dto.emailNotificationEnabled ?? current.emailNotificationEnabled,
    };
    await this.writePolicy(next);
    return next;
  }

  async listBlockedUsers() {
    const policy = await this.readPolicy();
    if (policy.blockedUserIds.length === 0) return [];
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: policy.blockedUserIds },
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        email: true,
      },
    });
    return policy.blockedUserIds.map((id) => {
      const user = users.find((item) => item.id === id);
      return {
        id,
        username: user?.username ?? null,
        nickname: user?.nickname ?? null,
        email: user?.email ?? null,
      };
    });
  }

  async blockUser(userId: string) {
    const policy = await this.readPolicy();
    if (policy.blockedUserIds.includes(userId)) {
      return policy;
    }
    const next = {
      ...policy,
      blockedUserIds: [...policy.blockedUserIds, userId],
    };
    await this.writePolicy(next);
    return next;
  }

  async unblockUser(userId: string) {
    const policy = await this.readPolicy();
    const next = {
      ...policy,
      blockedUserIds: policy.blockedUserIds.filter((id) => id !== userId),
    };
    await this.writePolicy(next);
    return next;
  }

  async create(
    user: RequestUser | null,
    articleId: string,
    dto: CreateCommentDto,
    context: RequestContext,
  ) {
    await this.securityService.assertIpNotBanned(context.ip);

    const policy = await this.readPolicy();
    if (!policy.guestCommentEnabled && !user) {
      throw new ForbiddenException('guest comments disabled');
    }

    if (user && policy.blockedUserIds.includes(user.sub)) {
      throw new ForbiddenException('user is blocked from commenting');
    }

    if (policy.captchaRequired || !user) {
      this.assertCaptcha(dto.captchaToken, dto.captchaAnswer);
    }

    const article = await this.prisma.article.findFirst({
      where: { id: articleId, deletedAt: null, status: 'PUBLISHED' },
      select: { id: true, authorId: true, author: { select: { email: true, nickname: true, username: true } } },
    });
    if (!article) {
      throw new NotFoundException('article not found');
    }

    let parent: { id: string; rootId: string | null } | null = null;
    if (dto.parentId) {
      parent = await this.prisma.comment.findFirst({
        where: { id: dto.parentId, articleId, deletedAt: null },
        select: { id: true, rootId: true },
      });
      if (!parent) {
        throw new NotFoundException('parent comment not found');
      }
    }

    const rootId = parent ? parent.rootId ?? parent.id : null;
    const floor = await this.nextFloor(articleId);
    const normalized = dto.content.trim();
    if (!normalized) {
      throw new BadRequestException('comment content required');
    }
    await this.securityService.assertTextNotBlocked(normalized);

    await this.assertRateLimit(user, context, policy);

    const sensitiveHit = containsSensitiveWord(normalized, policy.sensitiveWords);
    const reviewState = decideReviewState(policy, sensitiveHit);
    const images = dto.images && dto.images.length > 0 ? JSON.stringify(dto.images) : null;

    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.comment.create({
        data: {
          articleId,
          userId: user?.sub ?? null,
          parentId: parent?.id ?? null,
          rootId,
          content: normalized,
          images,
          ip: context.ip ?? null,
          isAnonymous: dto.isAnonymous ?? false,
          isAuthor: user?.sub === article.authorId,
          floor,
          reviewState,
        },
      });

      if (reviewState === 'APPROVED') {
        await tx.article.update({
          where: { id: articleId },
          data: {
            commentCount: { increment: 1 },
          },
        });
      }

      return row;
    });

    await this.notificationsService.notifyCommentAuthor({
      userId: article.authorId,
      recipientEmail: article.author.email,
      title: parent ? '你的文章有新回复' : '你的文章有新评论',
      content: `${article.author.nickname ?? article.author.username}: ${normalized.slice(0, 120)}`,
      emailEnabled: policy.emailNotificationEnabled,
    });

    return this.getDetail(created.id);
  }

  async list(articleId: string, dto: ListCommentsDto, currentUserId?: string) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;
    const onlyAuthor = dto.onlyAuthor === 1;

    const article = await this.prisma.article.findFirst({
      where: { id: articleId, deletedAt: null, status: 'PUBLISHED' },
      select: { id: true, authorId: true },
    });
    if (!article) throw new NotFoundException('article not found');

    const where: Prisma.CommentWhereInput = {
      articleId,
      deletedAt: null,
      reviewState: 'APPROVED',
      parentId: null,
    };
    if (dto.rootId) {
      where.id = dto.rootId;
    }
    if (onlyAuthor) {
      where.userId = article.authorId;
    }

    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        include: commentInclude(),
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy:
          dto.sort === 'hot'
            ? [{ likes: 'desc' }, { floor: 'asc' }]
            : [{ floor: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.comment.count({ where }),
    ]);

    const roots = items.map((item) => item.id);
    const replies = await this.prisma.comment.findMany({
      where: {
        articleId,
        deletedAt: null,
        reviewState: 'APPROVED',
        rootId: { in: roots },
      },
      include: commentInclude(),
      orderBy: [{ createdAt: 'asc' }],
    });

    const replyMap = new Map<string, ReturnType<typeof mapComment>[]>();
    for (const item of replies) {
      const key = item.rootId ?? item.id;
      const list = replyMap.get(key) ?? [];
      list.push(mapComment(item, currentUserId));
      replyMap.set(key, list);
    }

    return {
      items: items.map((item) => ({
        ...mapComment(item, currentUserId),
        replies: replyMap.get(item.id) ?? [],
      })),
      total,
      page,
      pageSize,
    };
  }

  async review(commentId: string, dto: ReviewCommentDto) {
    const existing = await this.prisma.comment.findFirst({
      where: { id: commentId, deletedAt: null },
      select: { id: true, articleId: true, reviewState: true, userId: true },
    });
    if (!existing) {
      throw new NotFoundException('comment not found');
    }

    const nextState: ReviewStatus = dto.status;
    if (existing.reviewState === nextState) {
      return this.getDetail(commentId);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id: commentId },
        data: {
          reviewState: nextState,
        },
      });

      if (existing.reviewState !== 'APPROVED' && nextState === 'APPROVED') {
        await tx.article.update({
          where: { id: existing.articleId },
          data: { commentCount: { increment: 1 } },
        });
      }
      if (existing.reviewState === 'APPROVED' && nextState !== 'APPROVED') {
        await tx.article.update({
          where: { id: existing.articleId },
          data: { commentCount: { decrement: 1 } },
        });
      }

      if (existing.userId) {
        await tx.notification.create({
          data: {
            userId: existing.userId,
            type: 'SYSTEM',
            channel: 'IN_APP',
            title: nextState === 'APPROVED' ? '评论审核通过' : '评论审核未通过',
            content: dto.reason ?? '请遵守社区规范。',
            sentAt: new Date(),
          },
        });
      }
    });

    return this.getDetail(commentId);
  }

  async listPending(page = 1, pageSize = 20) {
    const where: Prisma.CommentWhereInput = {
      deletedAt: null,
      reviewState: 'PENDING',
    };
    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        include: commentInclude(),
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ createdAt: 'asc' }],
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      items: items.map((item) => mapComment(item)),
      total,
      page,
      pageSize,
    };
  }

  async react(
    commentId: string,
    action: 'LIKE' | 'DISLIKE' | 'REPORT',
    user: RequestUser | null,
    context: RequestContext,
  ) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, deletedAt: null },
      select: { id: true },
    });
    if (!comment) {
      throw new NotFoundException('comment not found');
    }

    const identity = user?.sub ?? context.ip ?? '';
    if (!identity) {
      throw new ForbiddenException('unable to identify reactor');
    }

    const reactionKey = `${action}:${identity}`;
    const existing = await this.prisma.commentReaction.findFirst({
      where: {
        commentId,
        action: reactionKey,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (existing) {
      return this.getDetail(commentId);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.commentReaction.create({
        data: {
          commentId,
          userId: user?.sub ?? null,
          ip: context.ip ?? null,
          action: reactionKey,
        },
      });

      if (action === 'LIKE') {
        await tx.comment.update({
          where: { id: commentId },
          data: { likes: { increment: 1 } },
        });
      } else if (action === 'DISLIKE') {
        await tx.comment.update({
          where: { id: commentId },
          data: { dislikes: { increment: 1 } },
        });
      } else {
        await tx.comment.update({
          where: { id: commentId },
          data: { reports: { increment: 1 } },
        });
      }
    });

    return this.getDetail(commentId);
  }

  async getCaptchaChallenge() {
    return this.createCaptcha();
  }

  private async getDetail(commentId: string, currentUserId?: string) {
    const row = await this.prisma.comment.findFirst({
      where: { id: commentId, deletedAt: null },
      include: commentInclude(),
    });
    if (!row) throw new NotFoundException('comment not found');
    return mapComment(row, currentUserId);
  }

  private async nextFloor(articleId: string) {
    const aggregate = await this.prisma.comment.aggregate({
      where: { articleId, deletedAt: null },
      _max: { floor: true },
    });
    return (aggregate._max.floor ?? 0) + 1;
  }

  private async assertRateLimit(
    user: RequestUser | null,
    context: RequestContext,
    policy: CommentPolicy,
  ) {
    const identity = user?.sub ?? context.ip;
    if (!identity) return;

    const since = new Date(Date.now() - policy.commentCooldownSeconds * 1000);
    const recent = await this.prisma.comment.findFirst({
      where: {
        deletedAt: null,
        createdAt: { gte: since },
        OR: user
          ? [{ userId: user.sub }]
          : [{ ip: context.ip ?? '' }],
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      throw new HttpException('comment too fast, please wait', HttpStatus.TOO_MANY_REQUESTS);
    }

    const hourlySince = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyCount = await this.prisma.comment.count({
      where: {
        deletedAt: null,
        createdAt: { gte: hourlySince },
        OR: user ? [{ userId: user.sub }] : [{ ip: context.ip ?? '' }],
      },
    });
    if (hourlyCount >= policy.commentMaxPerHour) {
      throw new HttpException(
        'comment frequency limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private assertCaptcha(token?: string, answer?: string) {
    if (!token || !answer) {
      throw new ForbiddenException('captcha required');
    }
    const secret = this.getCaptchaSecret();
    const payload = parseSignedPayload(token, secret);
    if (!payload) {
      throw new ForbiddenException('invalid captcha token');
    }
    if (new Date(payload.expiresAt).getTime() < Date.now()) {
      throw new ForbiddenException('captcha expired');
    }
    if (signValue(answer.trim(), secret) !== payload.answerHash) {
      throw new ForbiddenException('invalid captcha answer');
    }
  }

  private async readPolicy(): Promise<CommentPolicy> {
    const row = await this.prisma.siteConfig.findFirst({
      where: { key: COMMENT_POLICY_KEY, deletedAt: null },
      select: { value: true },
    });
    if (!row) {
      return defaultPolicy();
    }
    const value = row.value as Partial<CommentPolicy>;
    return {
      guestCommentEnabled:
        typeof value.guestCommentEnabled === 'boolean'
          ? value.guestCommentEnabled
          : defaultPolicy().guestCommentEnabled,
      autoReviewEnabled:
        typeof value.autoReviewEnabled === 'boolean'
          ? value.autoReviewEnabled
          : defaultPolicy().autoReviewEnabled,
      reviewMode: value.reviewMode === 'MIXED' ? 'MIXED' : 'MANUAL',
      sensitiveWords: await this.readSensitiveWordsFromPolicyOrLibrary(value.sensitiveWords),
      blockedUserIds: Array.isArray(value.blockedUserIds)
        ? value.blockedUserIds.filter((item) => typeof item === 'string')
        : [],
      captchaRequired:
        typeof value.captchaRequired === 'boolean'
          ? value.captchaRequired
          : defaultPolicy().captchaRequired,
      commentCooldownSeconds:
        typeof value.commentCooldownSeconds === 'number'
          ? value.commentCooldownSeconds
          : defaultPolicy().commentCooldownSeconds,
      commentMaxPerHour:
        typeof value.commentMaxPerHour === 'number'
          ? value.commentMaxPerHour
          : defaultPolicy().commentMaxPerHour,
      emailNotificationEnabled:
        typeof value.emailNotificationEnabled === 'boolean'
          ? value.emailNotificationEnabled
          : defaultPolicy().emailNotificationEnabled,
    };
  }

  private async writePolicy(policy: CommentPolicy) {
    await this.prisma.siteConfig.upsert({
      where: { key: COMMENT_POLICY_KEY },
      update: {
        value: policy,
        deletedAt: null,
      },
      create: {
        key: COMMENT_POLICY_KEY,
        value: policy,
        description: 'comment policy settings',
      },
    });
  }

  private getCaptchaSecret() {
    return (
      this.configService.get<string>('app.commentCaptchaSecret') ??
      this.configService.get<string>('app.jwtAccessSecret') ??
      'comment-captcha-secret'
    );
  }

  private async readSensitiveWordsFromPolicyOrLibrary(source: unknown) {
    const byLibrary = await this.sensitiveWordsService.readEnabledWords();
    if (byLibrary.length > 0) return byLibrary;
    if (Array.isArray(source)) {
      return source.filter((item): item is string => typeof item === 'string');
    }
    return [];
  }
}

function defaultPolicy(): CommentPolicy {
  return {
    guestCommentEnabled: true,
    autoReviewEnabled: false,
    reviewMode: 'MANUAL',
    sensitiveWords: [],
    blockedUserIds: [],
    captchaRequired: true,
    commentCooldownSeconds: 30,
    commentMaxPerHour: 12,
    emailNotificationEnabled: false,
  };
}

function decideReviewState(policy: CommentPolicy, sensitiveHit: boolean): ReviewStatus {
  if (policy.reviewMode === 'MANUAL') return 'PENDING';
  if (sensitiveHit) return 'REJECTED';
  if (policy.autoReviewEnabled) return 'APPROVED';
  return 'PENDING';
}

function containsSensitiveWord(content: string, words: string[]) {
  const lowerContent = content.toLowerCase();
  return words.some((word) => lowerContent.includes(word.toLowerCase()));
}

function parseImages(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function signValue(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('hex');
}

function signPayload(payload: { answerHash: string; expiresAt: string }, secret: string) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function parseSignedPayload(
  token: string,
  secret: string,
): { answerHash: string; expiresAt: string } | null {
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = createHmac('sha256', secret).update(data).digest('base64url');
  if (expected !== sig) return null;
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as {
      answerHash?: string;
      expiresAt?: string;
    };
    if (!parsed.answerHash || !parsed.expiresAt) return null;
    return { answerHash: parsed.answerHash, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

function commentInclude() {
  return {
    user: {
      select: {
        id: true,
        username: true,
        nickname: true,
        avatarUrl: true,
      },
    },
  } satisfies Prisma.CommentInclude;
}

function mapComment(
  comment: Prisma.CommentGetPayload<{ include: ReturnType<typeof commentInclude> }>,
  currentUserId?: string,
) {
  const isMine = currentUserId ? comment.userId === currentUserId : false;
  return {
    id: comment.id,
    articleId: comment.articleId,
    parentId: comment.parentId,
    rootId: comment.rootId,
    content: comment.content,
    images: parseImages(comment.images),
    isAnonymous: comment.isAnonymous,
    isAuthor: comment.isAuthor,
    likes: comment.likes,
    dislikes: comment.dislikes,
    reports: comment.reports,
    floor: comment.floor,
    reviewState: comment.reviewState,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    isMine,
    user:
      comment.isAnonymous && !isMine
        ? null
        : comment.user
          ? {
              id: comment.user.id,
              username: comment.user.username,
              nickname: comment.user.nickname,
              avatarUrl: comment.user.avatarUrl,
            }
          : null,
  };
}
