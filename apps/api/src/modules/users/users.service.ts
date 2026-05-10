import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateProfileDto } from './dto/update-profile.dto'

type PublicProfile = {
  id: string
  username: string
  nickname: string | null
  avatarUrl: string | null
  bio: string | null
  signature: string | null
  website: string | null
  location: string | null
  followerCount: number
  followingCount: number
  articleCount: number
  isFollowing: boolean
  isSelf: boolean
}

type AccountProfile = PublicProfile & {
  email: string
  roleCodes: string[]
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.buildAccountProfile(userId)
  }

  async getPublicProfile(viewerId: string | null, userId: string) {
    return this.buildPublicProfile(userId, viewerId)
  }

  async follow(viewerId: string, targetUserId: string) {
    if (viewerId === targetUserId) {
      throw new BadRequestException('cannot follow yourself')
    }

    const target = await this.requireUser(targetUserId)
    const existing = await this.prisma.follow.findFirst({
      where: {
        followerId: viewerId,
        followingId: target.id,
      },
      select: { id: true, deletedAt: true },
    })

    if (existing) {
      await this.prisma.follow.update({
        where: { id: existing.id },
        data: { deletedAt: null },
      })
    } else {
      await this.prisma.follow.create({
        data: {
          followerId: viewerId,
          followingId: target.id,
        },
      })
    }

    return this.buildPublicProfile(targetUserId, viewerId)
  }

  async unfollow(viewerId: string, targetUserId: string) {
    if (viewerId === targetUserId) {
      throw new BadRequestException('cannot unfollow yourself')
    }

    const target = await this.requireUser(targetUserId)
    const existing = await this.prisma.follow.findFirst({
      where: {
        followerId: viewerId,
        followingId: target.id,
      },
      select: { id: true },
    })

    if (existing) {
      await this.prisma.follow.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      })
    }

    return this.buildPublicProfile(targetUserId, viewerId)
  }

  async listFollowers(viewerId: string | null, userId: string) {
    await this.requireUser(userId)
    const rows = await this.prisma.follow.findMany({
      where: { followingId: userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          select: userCardSelect(),
        },
      },
    })

    return this.mapFollowCards(rows, 'follower', userId, viewerId)
  }

  async listFollowing(viewerId: string | null, userId: string) {
    await this.requireUser(userId)
    const rows = await this.prisma.follow.findMany({
      where: { followerId: userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        following: {
          select: userCardSelect(),
        },
      },
    })

    return this.mapFollowCards(rows, 'following', userId, viewerId)
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Prisma.UserUpdateInput = {}
    if (dto.nickname !== undefined) {
      data.nickname = dto.nickname
    }
    if (dto.avatarUrl !== undefined) {
      data.avatarUrl = dto.avatarUrl
    }
    if (dto.signature !== undefined) {
      data.signature = dto.signature
    }
    if (dto.bio !== undefined) {
      data.bio = dto.bio
    }
    if (dto.location !== undefined) {
      data.location = dto.location
    }
    if (dto.website !== undefined) {
      data.website = dto.website
    }

    await this.prisma.user.update({
      where: { id: userId },
      data,
    })

    return this.buildAccountProfile(userId)
  }

  private async buildAccountProfile(userId: string): Promise<AccountProfile> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        roles: {
          where: { deletedAt: null },
          include: { role: true },
        },
      },
    })
    if (!user) {
      throw new NotFoundException('user not found')
    }

    const publicProfile = await this.buildPublicProfile(userId, userId, user)
    return {
      ...publicProfile,
      email: user.email,
      roleCodes: user.roles.map((item) => item.role.code),
    }
  }

  private async buildPublicProfile(
    userId: string,
    viewerId: string | null,
    cachedUser?: {
      id: string
      username: string
      nickname: string | null
      avatarUrl: string | null
      bio: string | null
      signature: string | null
      website: string | null
      location: string | null
    },
  ): Promise<PublicProfile> {
    const user =
      cachedUser ??
      (await this.requireUser(userId, {
        id: true,
        username: true,
        nickname: true,
        avatarUrl: true,
        bio: true,
        signature: true,
        website: true,
        location: true,
      }))

    const [followerCount, followingCount, articleCount, isFollowing] = await Promise.all([
      this.prisma.follow.count({
        where: { followingId: userId, deletedAt: null },
      }),
      this.prisma.follow.count({
        where: { followerId: userId, deletedAt: null },
      }),
      this.prisma.article.count({
        where: { authorId: userId, deletedAt: null, status: 'PUBLISHED' },
      }),
      viewerId
        ? this.prisma.follow.findFirst({
            where: {
              followerId: viewerId,
              followingId: userId,
              deletedAt: null,
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ])

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      signature: user.signature,
      website: user.website,
      location: user.location,
      followerCount,
      followingCount,
      articleCount,
      isFollowing: Boolean(isFollowing),
      isSelf: viewerId === userId,
    }
  }

  private async requireUser<TSelect extends Prisma.UserSelect = Prisma.UserSelect>(
    userId: string,
    select?: TSelect,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      ...(select ? { select } : {}),
    })
    if (!user) {
      throw new NotFoundException('user not found')
    }
    return user as Prisma.UserGetPayload<{ select: TSelect }>
  }

  private mapFollowCards(
    rows: Array<{
      createdAt: Date
      follower?: {
        id: string
        username: string
        nickname: string | null
        avatarUrl: string | null
        bio: string | null
        signature: string | null
        website: string | null
        location: string | null
      }
      following?: {
        id: string
        username: string
        nickname: string | null
        avatarUrl: string | null
        bio: string | null
        signature: string | null
        website: string | null
        location: string | null
      }
    }>,
    direction: 'follower' | 'following',
    ownerId: string,
    viewerId: string | null,
  ) {
    const counterpartIds = rows.map((row) => {
      const user = direction === 'follower' ? row.follower : row.following
      return user?.id ?? ''
    }).filter((id) => id.length > 0)

    const mutualRows =
      viewerId && counterpartIds.length > 0
        ? this.prisma.follow.findMany({
            where: {
              followerId: ownerId,
              followingId: { in: counterpartIds },
              deletedAt: null,
            },
            select: {
              followingId: true,
            },
          })
        : Promise.resolve([] as Array<{ followingId: string }>)

    return mutualRows.then((mutual) => {
      const mutualSet = new Set(mutual.map((item) => item.followingId))
      return rows.map((row) => {
        const user = direction === 'follower' ? row.follower : row.following
        if (!user) {
          throw new NotFoundException('user not found')
        }
        return {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          signature: user.signature,
          website: user.website,
          location: user.location,
          followedAt: row.createdAt.toISOString(),
          isMutual: mutualSet.has(user.id),
        }
      })
    })
  }
}

function userCardSelect() {
  return {
    id: true,
    username: true,
    nickname: true,
    avatarUrl: true,
    bio: true,
    signature: true,
    website: true,
    location: true,
  } satisfies Prisma.UserSelect
}

