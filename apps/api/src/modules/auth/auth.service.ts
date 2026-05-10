import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import * as bcrypt from 'bcrypt';
import { createHmac, randomInt } from 'crypto';
import type { RoleCode, User } from '@prisma/client';
import { SecurityService } from '../security/security.service';
import { AuthCaptchaChallenge } from './dto/auth-captcha.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { GeoipService } from '../security/geoip.service';

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
    private readonly securityService: SecurityService,
    private readonly notificationsService: NotificationsService,
    private readonly geoipService: GeoipService,
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

  async login(dto: LoginDto, ip?: string, userAgent?: string): Promise<AuthResponseDto> {
    await this.securityService.assertIpNotBanned(ip);
    this.assertCaptcha(dto.captchaToken, dto.captchaAnswer);

    const key = this.normalizeLoginKey(dto.username);
    await this.assertLoginNotBlocked(key, ip);

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
      await this.recordLoginFailure(key, ip, userAgent, null, 'invalid credentials');
      throw new UnauthorizedException('invalid credentials');
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!validPassword) {
      await this.recordLoginFailure(key, ip, userAgent, user.id, 'invalid credentials');
      throw new UnauthorizedException('invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip ?? null },
    });

    const geo = this.geoipService.lookup(ip);
    const location = formatLocation(geo);
    await this.maybeNotifySuspiciousLogin(user.id, ip, location, userAgent, geo);

    await this.prisma.loginLog.create({
      data: {
        userId: user.id,
        username: user.username,
        ip: ip ?? 'unknown',
        userAgent: userAgent ?? null,
        deviceType: detectDeviceType(userAgent),
        location,
        isSuccess: true,
        reason: null,
      },
    });

    return this.sign(user);
  }

  createCaptcha(): AuthCaptchaChallenge {
    const secret = this.getCaptchaSecret();
    const left = randomInt(2, 20);
    const right = randomInt(1, 20);
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

  private async assertLoginNotBlocked(key: string, ip?: string) {
    const maxFailures = this.configService.get<number>('app.loginMaxFailures') ?? 5;
    const blockMinutes = this.configService.get<number>('app.loginBlockMinutes') ?? 15;
    const since = new Date(Date.now() - blockMinutes * 60 * 1000);
    const failedCount = await this.prisma.loginLog.count({
      where: {
        deletedAt: null,
        createdAt: { gte: since },
        isSuccess: false,
        OR:
          ip && ip.trim().length > 0
            ? [{ username: key }, { ip: ip.trim() }]
            : [{ username: key }],
      },
    });
    if (failedCount >= maxFailures) {
      throw new ForbiddenException(`login temporarily blocked, retry in ${blockMinutes} minutes`);
    }
  }

  private async recordLoginFailure(
    key: string,
    ip: string | undefined,
    userAgent: string | undefined,
    userId: string | null,
    reason: string,
  ) {
    await this.prisma.loginLog.create({
      data: {
        userId,
        username: key,
        ip: ip?.trim() || 'unknown',
        userAgent: userAgent ?? null,
        deviceType: detectDeviceType(userAgent),
        location: null,
        isSuccess: false,
        reason,
      },
    });
  }

  private normalizeLoginKey(input: string) {
    return input.trim().toLowerCase();
  }

  private async maybeNotifySuspiciousLogin(
    userId: string,
    ip: string | undefined,
    location: string,
    userAgent: string | undefined,
    geo: { country: string; region: string; city: string; timezone: string; ll: [number, number] | null; asn: string | null },
  ) {
    const normalizedIp = ip?.trim();
    if (!normalizedIp || normalizedIp === 'unknown') return;

    const previous = await this.prisma.loginLog.findFirst({
      where: {
        userId,
        isSuccess: true,
        deletedAt: null,
        ip: { not: normalizedIp },
      },
      orderBy: [{ createdAt: 'desc' }],
      select: { ip: true, location: true, createdAt: true },
    });
    if (!previous) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, nickname: true, username: true },
    });
    if (!user) return;

    const score = calculateSuspiciousScore({
      currentIp: normalizedIp,
      previousIp: previous.ip,
      currentLocation: location,
      previousLocation: previous.location ?? 'unknown',
      userAgent: userAgent ?? '',
    });
    if (score < 40) return;

    const title = '异地登录提醒';
    const content = [
      `账号 ${user.nickname ?? user.username} 检测到新的登录环境。`,
      `本次登录IP: ${normalizedIp} (${location})`,
      `最近历史IP: ${previous.ip} (${previous.location ?? 'unknown'})`,
      `风险评分: ${score}`,
      `地理信息: ${geo.country}/${geo.region}/${geo.city} (${geo.timezone})`,
      `时间: ${new Date().toISOString()}`,
      `UA: ${userAgent ?? 'unknown'}`,
    ].join('\n');

    const emailEnabled = this.readBool(this.configService.get<string>('app.securityLoginAlertEmailEnabled'));
    await this.notificationsService.notifySecurityAlert({
      userId,
      recipientEmail: user.email ?? null,
      title,
      content,
      emailEnabled,
    });
  }

  private getCaptchaSecret() {
    return (
      this.configService.get<string>('app.loginCaptchaSecret') ??
      this.configService.get<string>('app.jwtAccessSecret') ??
      'login-captcha-secret'
    );
  }

  private readBool(value?: string) {
    return value === 'true' || value === '1';
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

function detectDeviceType(userAgent: string | undefined) {
  const ua = (userAgent ?? '').toLowerCase();
  if (!ua) return 'unknown';
  if (ua.includes('mobile')) return 'mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  return 'desktop';
}

function formatLocation(input: { country: string; region: string; city: string }) {
  if (input.country === 'unknown') return 'unknown';
  return [input.country, input.region, input.city].filter((item) => item && item !== 'unknown').join('/');
}

function calculateSuspiciousScore(input: {
  currentIp: string;
  previousIp: string;
  currentLocation: string;
  previousLocation: string;
  userAgent: string;
}) {
  let score = 0;
  if (input.currentIp !== input.previousIp) score += 35;
  if (input.currentLocation !== 'unknown' && input.previousLocation !== 'unknown' && input.currentLocation !== input.previousLocation) {
    score += 35;
  }
  const ua = input.userAgent.toLowerCase();
  if (!ua.includes('chrome') && !ua.includes('safari') && !ua.includes('firefox') && !ua.includes('edg')) {
    score += 10;
  }
  if (input.currentIp.startsWith('127.') || input.currentIp.startsWith('192.168.')) {
    score -= 20;
  }
  return Math.max(0, Math.min(100, score));
}
