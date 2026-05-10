import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIpBanDto } from './dto/create-ip-ban.dto';
import { CreateSecurityKeywordBanDto } from './dto/create-security-keyword-ban.dto';

@Injectable()
export class SecurityService {
  constructor(private readonly prisma: PrismaService) {}

  async listIpBans() {
    return this.prisma.bannedIp.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async createIpBan(dto: CreateIpBanDto) {
    const ip = dto.ip.trim();
    if (!ip) throw new BadRequestException('ip is required');
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException('invalid expiresAt');
    }

    return this.prisma.bannedIp.upsert({
      where: { ip },
      update: {
        reason: dto.reason?.trim() || null,
        expiresAt,
        deletedAt: null,
      },
      create: {
        ip,
        reason: dto.reason?.trim() || null,
        expiresAt,
      },
    });
  }

  async removeIpBan(id: string) {
    await this.prisma.bannedIp.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  }

  async listKeywordBans() {
    const row = await this.prisma.siteConfig.findUnique({
      where: { key: 'security.keyword_bans' },
      select: { value: true, updatedAt: true },
    });
    const items = parseKeywordBans(row?.value);
    return {
      items,
      updatedAt: row?.updatedAt ?? null,
    };
  }

  async listBlockedDomains() {
    const row = await this.prisma.siteConfig.findUnique({
      where: { key: 'security.blocked_link_domains' },
      select: { value: true, updatedAt: true },
    });
    return {
      items: parseStringArray(row?.value),
      updatedAt: row?.updatedAt ?? null,
    };
  }

  async createKeywordBan(dto: CreateSecurityKeywordBanDto) {
    const list = await this.listKeywordBans();
    const keyword = dto.keyword.trim();
    if (!keyword) throw new BadRequestException('keyword is required');

    const exists = list.items.some((item) => item.keyword.toLowerCase() === keyword.toLowerCase());
    if (exists) return list;

    const next = [
      ...list.items,
      {
        id: buildKeywordBanId(keyword),
        keyword,
        reason: dto.reason?.trim() || null,
        createdAt: new Date().toISOString(),
      },
    ];
    await this.writeKeywordBans(next);
    return { items: next };
  }

  async removeKeywordBan(id: string) {
    const list = await this.listKeywordBans();
    const next = list.items.filter((item) => item.id !== id);
    await this.writeKeywordBans(next);
    return { id };
  }

  async addBlockedDomain(domainRaw: string) {
    const domain = normalizeDomain(domainRaw);
    if (!domain) throw new BadRequestException('domain is required');

    const current = await this.listBlockedDomains();
    if (current.items.includes(domain)) return current;
    const next = [...current.items, domain];
    await this.writeBlockedDomains(next);
    return { items: next };
  }

  async removeBlockedDomain(domainRaw: string) {
    const domain = normalizeDomain(domainRaw);
    if (!domain) throw new BadRequestException('domain is required');
    const current = await this.listBlockedDomains();
    const next = current.items.filter((item) => item !== domain);
    await this.writeBlockedDomains(next);
    return { items: next };
  }

  async assertIpNotBanned(ip?: string) {
    const normalized = (ip ?? '').trim();
    if (!normalized) return;
    const now = new Date();
    const row = await this.prisma.bannedIp.findFirst({
      where: {
        ip: normalized,
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { id: true, reason: true, expiresAt: true },
    });
    if (!row) return;
    throw new ForbiddenException(row.reason || 'ip is banned');
  }

  async assertTextNotBlocked(text: string) {
    const normalized = text.trim();
    if (!normalized) return;
    const list = await this.listKeywordBans();
    const lower = normalized.toLowerCase();
    const hit = list.items.find((item) => lower.includes(item.keyword.toLowerCase()));
    if (!hit) return;
    throw new ForbiddenException(`security keyword blocked: ${hit.keyword}`);
  }

  async recordSecurityEvent(input: {
    type: 'IP_BAN_HIT' | 'RATE_LIMIT_HIT' | 'MALICIOUS_REFERRER_HIT';
    ip: string;
    detail: string;
  }) {
    await this.prisma.operationLog.create({
      data: {
        userId: null,
        module: 'SECURITY',
        action: input.type,
        resourceId: input.ip,
        payload: {
          ip: input.ip,
          detail: input.detail,
          at: new Date().toISOString(),
        },
        ip: input.ip,
        userAgent: null,
      },
    });
  }

  private async writeKeywordBans(items: SecurityKeywordBanItem[]) {
    await this.prisma.siteConfig.upsert({
      where: { key: 'security.keyword_bans' },
      update: {
        value: items,
        deletedAt: null,
        description: 'security keyword bans',
      },
      create: {
        key: 'security.keyword_bans',
        value: items,
        description: 'security keyword bans',
      },
    });
  }

  private async writeBlockedDomains(items: string[]) {
    await this.prisma.siteConfig.upsert({
      where: { key: 'security.blocked_link_domains' },
      update: {
        value: items,
        deletedAt: null,
        description: 'security blocked link domains',
      },
      create: {
        key: 'security.blocked_link_domains',
        value: items,
        description: 'security blocked link domains',
      },
    });
  }
}

type SecurityKeywordBanItem = {
  id: string;
  keyword: string;
  reason: string | null;
  createdAt: string;
};

function parseKeywordBans(raw: unknown): SecurityKeywordBanItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : buildKeywordBanId(String(item.keyword ?? '')),
      keyword: typeof item.keyword === 'string' ? item.keyword : '',
      reason: typeof item.reason === 'string' ? item.reason : null,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    }))
    .filter((item) => item.keyword.trim().length > 0);
}

function buildKeywordBanId(keyword: string) {
  return `kw_${keyword.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 64)}`;
}

function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}

function normalizeDomain(domainRaw: string) {
  const value = domainRaw.trim().toLowerCase();
  if (!value) return '';
  return value.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}
