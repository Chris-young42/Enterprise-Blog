import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import * as bcrypt from 'bcrypt';
import type { RoleCode, User } from '@prisma/client';

type AuthUserPayload = {
  sub: string;
  username: string;
  roleCodes: string[];
};

type UserWithRoles = User & {
  roles: Array<{
    role: {
      code: RoleCode;
    };
  }>;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const duplicate = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }],
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new BadRequestException('username or email already exists');
    }

    const saltRounds = this.configService.get<number>('app.bcryptSaltRounds') ?? 12;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const visitorRole = await this.prisma.role.findUnique({
      where: { code: 'AUTHOR' },
      select: { id: true, code: true },
    });
    if (!visitorRole) {
      throw new BadRequestException('default role is not initialized, run seed first');
    }

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        nickname: dto.nickname ?? dto.username,
        passwordHash,
        roles: {
          create: {
            roleId: visitorRole.id,
          },
        },
      },
      include: {
        roles: {
          where: { deletedAt: null },
          include: { role: true },
        },
      },
    });

    return this.sign(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ username: dto.username }, { email: dto.username }],
      },
      include: {
        roles: {
          where: { deletedAt: null },
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('invalid credentials');
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.sign(user);
  }

  async profile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        roles: {
          where: { deletedAt: null },
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('user not found');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      signature: user.signature,
      roleCodes: user.roles.map((item) => item.role.code),
    };
  }

  private sign(user: UserWithRoles): AuthResponseDto {
    const roleCodes = user.roles.map((item) => item.role.code);
    const payload: AuthUserPayload = {
      sub: user.id,
      username: user.username,
      roleCodes,
    };
    const expiresIn = this.configService.get<string>('app.jwtAccessExpiresIn') ?? '1d';
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        roleCodes: roleCodes as string[],
      },
    };
  }
}
