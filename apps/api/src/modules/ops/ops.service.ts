import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BackupTaskType, Prisma, StaticTaskStatus } from '@prisma/client';
import { spawn } from 'child_process';
import { createHash, createHmac, randomUUID } from 'crypto';
import { mkdir, readdir, readFile, writeFile } from 'fs/promises';
import { isAbsolute, join, resolve } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSiteProfileDto } from './dto/site-profile.dto';

type SiteProfile = {
  name: string;
  logo: string;
  icp: string;
  copyright: string;
};

type OpsActor = {
  userId: string | null;
  ip: string | null;
  userAgent: string | null;
  roleCodes?: string[];
};

type BackupSnapshot = {
  createdAt: string;
  siteConfigs: Array<{
    key: string;
    value: Prisma.InputJsonValue;
    description: string | null;
    deletedAt: string | null;
  }>;
  categories: Array<{
    id: string;
    parentId: string | null;
    name: string;
    slug: string;
    description: string | null;
    sortOrder: number;
    deletedAt: string | null;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    deletedAt: string | null;
  }>;
  series: Array<{
    id: string;
    title: string;
    slug: string;
    description: string | null;
    coverUrl: string | null;
    sortOrder: number;
    deletedAt: string | null;
  }>;
  pages: Array<{
    id: string;
    title: string;
    slug: string;
    content: string;
    seoTitle: string | null;
    seoDescription: string | null;
    isPublished: boolean;
    deletedAt: string | null;
  }>;
};

type RestorePreparation = {
  normalizedPath: string;
  checksum: string;
  fileSizeBytes: number;
  snapshot: BackupSnapshot;
  report: {
    sourceFile: string;
    fileSizeBytes: number;
    checksum: string;
    snapshotCreatedAt: string;
    entities: {
      siteConfigs: number;
      categories: number;
      tags: number;
      series: number;
      pages: number;
    };
    warnings: string[];
  };
};

type MigratePreparation = {
  target: string;
  statusOutput: string;
  hasPendingMigrations: boolean;
  report: {
    target: string;
    hasPendingMigrations: boolean;
    statusSummary: string;
    warnings: string[];
  };
};

type ConfirmationPayload = {
  tokenId: string;
  action: 'RESTORE' | 'MIGRATE';
  fingerprint: string;
  issuedAt: string;
  expiresAt: string;
  operatorId: string | null;
  initiatorId: string | null;
};

const SITE_PROFILE_KEY = 'site.profile';

@Injectable()
export class OpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async clearCache() {
    return {
      success: true,
      clearedKeys: ['site-configs', 'stats-overview', 'content-ranking'],
      message: 'cache clear task accepted',
      at: new Date(),
    };
  }

  async generateStatic() {
    const startedAt = new Date();
    const taskNo = buildTaskNo('STATIC');
    const outputDir = resolve(this.configService.get<string>('app.staticOutputDir') ?? './static-export');
    const routes = ['/', '/tags', '/timeline', '/moments', '/friend-links', '/downloads'];

    const task = await this.prisma.staticGenerationTask.create({
      data: {
        taskNo,
        status: 'RUNNING',
        outputDir,
        generatedRoutes: JSON.stringify(routes),
        generatedFiles: JSON.stringify([]),
        startedAt,
      },
    });

    try {
      await mkdir(outputDir, { recursive: true });
      const files: string[] = [];

      for (const route of routes) {
        const payload = await this.buildStaticPayload(route);
        const routePath = route === '/' ? '/index' : `${route}/index`;
        const relativePath = routePath.replace(/^\//, '') + '.json';
        const absolutePath = join(outputDir, relativePath);
        await mkdir(join(outputDir, routePath.replace(/^\//, '')), { recursive: true });
        await writeFile(absolutePath, JSON.stringify(payload, null, 2), 'utf8');
        files.push(relativePath);
      }

      await this.prisma.staticGenerationTask.update({
        where: { id: task.id },
        data: {
          status: 'SUCCESS',
          fileCount: files.length,
          generatedFiles: JSON.stringify(files),
          finishedAt: new Date(),
        },
      });

      return {
        success: true,
        taskNo,
        outputDir,
        generated: routes,
        files,
        message: 'static generation completed',
        at: new Date(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown static generation error';
      await this.prisma.staticGenerationTask.update({
        where: { id: task.id },
        data: {
          status: 'FAILED',
          error: message,
          finishedAt: new Date(),
        },
      });
      return {
        success: false,
        taskNo,
        outputDir,
        generated: [],
        files: [],
        message,
        at: new Date(),
      };
    }
  }

  async listStaticTasks(pageRaw?: string, pageSizeRaw?: string) {
    const page = Math.max(1, Number(pageRaw ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeRaw ?? 20) || 20));

    const where = { deletedAt: null };
    const [items, total] = await Promise.all([
      this.prisma.staticGenerationTask.findMany({
        where,
        orderBy: [{ startedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.staticGenerationTask.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        taskNo: item.taskNo,
        status: item.status,
        outputDir: item.outputDir,
        generatedRoutes: parseJsonArray(item.generatedRoutes),
        generatedFiles: parseJsonArray(item.generatedFiles),
        fileCount: item.fileCount,
        startedAt: item.startedAt,
        finishedAt: item.finishedAt,
        error: item.error,
      })),
      total,
      page,
      pageSize,
    };
  }

  async listStaticArtifacts() {
    const outputDir = resolve(this.configService.get<string>('app.staticOutputDir') ?? './static-export');
    await mkdir(outputDir, { recursive: true });
    const files = await walkFiles(outputDir, outputDir);
    return { outputDir, files };
  }

  async backup(actor: OpsActor) {
    return this.runBackupTask('BACKUP', actor);
  }

  async restorePrecheck(restoreFrom: string, actor: OpsActor) {
    const prepared = await this.prepareRestore(restoreFrom);
    const fingerprint = buildFingerprint('RESTORE', `${prepared.normalizedPath}:${prepared.checksum}`);
    const token = this.issueConfirmationToken('RESTORE', fingerprint, actor.userId, actor.userId);

    await this.writeAudit(actor, 'RESTORE_PRECHECK', token.tokenId, {
      sourceFile: prepared.report.sourceFile,
      checksum: prepared.report.checksum,
      expiresAt: token.expiresAt,
    });

    return {
      ok: true,
      report: prepared.report,
      confirmToken: token.token,
      tokenId: token.tokenId,
      requiredPhrase: requiredConfirmPhrase('RESTORE'),
      expiresAt: token.expiresAt,
    };
  }

  async restore(
    input: {
      restoreFrom: string;
      confirmToken?: string;
      dryRun?: boolean;
      confirmPhrase?: string;
      approvalReason?: string;
    },
    actor: OpsActor,
  ) {
    const prepared = await this.prepareRestore(input.restoreFrom);

    if (input.dryRun) {
      await this.writeAudit(actor, 'RESTORE_DRY_RUN', null, {
        sourceFile: prepared.report.sourceFile,
        checksum: prepared.report.checksum,
      });
      return {
        success: true,
        dryRun: true,
        report: prepared.report,
      };
    }

    if (!input.confirmToken) {
      throw new BadRequestException('confirmToken is required when dryRun is false');
    }
    assertConfirmPhrase('RESTORE', input.confirmPhrase);
    assertApprovalReason(input.approvalReason);
    this.assertFinalApproverRole(actor.roleCodes);

    const fingerprint = buildFingerprint('RESTORE', `${prepared.normalizedPath}:${prepared.checksum}`);
    const payload = await this.verifyAndConsumeToken('RESTORE', input.confirmToken, fingerprint, actor.userId);
    this.assertDualApproval(payload, actor.userId);

    const taskResult = await this.runBackupTask('RESTORE', actor, prepared.normalizedPath, {
      approverId: actor.userId,
      initiatorId: payload.initiatorId,
      tokenId: payload.tokenId,
      approvalReason: input.approvalReason ?? '',
    });
    return {
      ...taskResult,
      tokenId: payload.tokenId,
      approverId: actor.userId,
      initiatorId: payload.initiatorId,
      approvalReason: input.approvalReason,
      dryRun: false,
      report: prepared.report,
    };
  }

  async migratePrecheck(targetRaw: string | undefined, actor: OpsActor) {
    const prepared = await this.prepareMigrate(targetRaw);
    const fingerprint = buildFingerprint('MIGRATE', `${prepared.target}:${createHash('sha256').update(prepared.statusOutput).digest('hex')}`);
    const token = this.issueConfirmationToken('MIGRATE', fingerprint, actor.userId, actor.userId);

    await this.writeAudit(actor, 'MIGRATE_PRECHECK', token.tokenId, {
      target: prepared.target,
      hasPendingMigrations: prepared.hasPendingMigrations,
      expiresAt: token.expiresAt,
    });

    return {
      ok: true,
      report: prepared.report,
      confirmToken: token.token,
      tokenId: token.tokenId,
      requiredPhrase: requiredConfirmPhrase('MIGRATE'),
      expiresAt: token.expiresAt,
    };
  }

  async migrate(
    input: {
      target?: string;
      confirmToken?: string;
      dryRun?: boolean;
      confirmPhrase?: string;
      approvalReason?: string;
    },
    actor: OpsActor,
  ) {
    const prepared = await this.prepareMigrate(input.target);

    if (input.dryRun) {
      await this.writeAudit(actor, 'MIGRATE_DRY_RUN', null, {
        target: prepared.target,
        hasPendingMigrations: prepared.hasPendingMigrations,
      });
      return {
        success: true,
        dryRun: true,
        report: prepared.report,
      };
    }

    if (!input.confirmToken) {
      throw new BadRequestException('confirmToken is required when dryRun is false');
    }
    assertConfirmPhrase('MIGRATE', input.confirmPhrase);
    assertApprovalReason(input.approvalReason);
    this.assertFinalApproverRole(actor.roleCodes);

    const fingerprint = buildFingerprint('MIGRATE', `${prepared.target}:${createHash('sha256').update(prepared.statusOutput).digest('hex')}`);
    const payload = await this.verifyAndConsumeToken('MIGRATE', input.confirmToken, fingerprint, actor.userId);
    this.assertDualApproval(payload, actor.userId);

    const taskResult = await this.runBackupTask('MIGRATE', actor, prepared.target, {
      approverId: actor.userId,
      initiatorId: payload.initiatorId,
      tokenId: payload.tokenId,
      approvalReason: input.approvalReason ?? '',
    });
    return {
      ...taskResult,
      tokenId: payload.tokenId,
      approverId: actor.userId,
      initiatorId: payload.initiatorId,
      approvalReason: input.approvalReason,
      dryRun: false,
      report: prepared.report,
    };
  }

  async listBackupTasks(pageRaw?: string, pageSizeRaw?: string, typeRaw?: string, statusRaw?: string) {
    const page = Math.max(1, Number(pageRaw ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeRaw ?? 20) || 20));
    const type = normalizeBackupType(typeRaw);
    const status = normalizeStaticTaskStatus(statusRaw);

    const where = {
      deletedAt: null,
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.backupTask.findMany({
        where,
        orderBy: [{ startedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.backupTask.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async listApprovalRecords(pageRaw?: string, pageSizeRaw?: string) {
    const page = Math.max(1, Number(pageRaw ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeRaw ?? 20) || 20));

    const where: Prisma.OperationLogWhereInput = {
      deletedAt: null,
      OR: [
        { module: 'OPS_CONFIRM' },
        {
          module: 'OPS',
          action: { in: ['OPS_TASK_START', 'OPS_TASK_SUCCESS', 'OPS_TASK_FAILED'] },
        },
      ],
    };

    const [items, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true, nickname: true },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.operationLog.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async getSiteProfile(): Promise<SiteProfile> {
    const row = await this.prisma.siteConfig.findFirst({
      where: { key: SITE_PROFILE_KEY, deletedAt: null },
      select: { value: true },
    });

    if (!row) return defaultSiteProfile();
    const value = row.value as Partial<SiteProfile>;

    return {
      name: typeof value.name === 'string' ? value.name : defaultSiteProfile().name,
      logo: typeof value.logo === 'string' ? value.logo : defaultSiteProfile().logo,
      icp: typeof value.icp === 'string' ? value.icp : defaultSiteProfile().icp,
      copyright:
        typeof value.copyright === 'string' ? value.copyright : defaultSiteProfile().copyright,
    };
  }

  async updateSiteProfile(dto: UpdateSiteProfileDto) {
    const current = await this.getSiteProfile();
    const next: SiteProfile = {
      name: dto.name?.trim() || current.name,
      logo: dto.logo?.trim() || current.logo,
      icp: dto.icp?.trim() || current.icp,
      copyright: dto.copyright?.trim() || current.copyright,
    };

    await this.prisma.siteConfig.upsert({
      where: { key: SITE_PROFILE_KEY },
      update: {
        value: next,
        description: 'site base profile',
        deletedAt: null,
      },
      create: {
        key: SITE_PROFILE_KEY,
        value: next,
        description: 'site base profile',
      },
    });

    return next;
  }
  private async runBackupTask(
    type: BackupTaskType,
    actor: OpsActor,
    param?: string,
    approval?: {
      initiatorId: string | null;
      approverId: string | null;
      tokenId: string;
      approvalReason: string;
    },
  ) {
    const startedAt = new Date();
    const taskNo = buildTaskNo(type);
    const outputDir = resolve(this.configService.get<string>('app.backupOutputDir') ?? './backups');
    await mkdir(outputDir, { recursive: true });

    const artifactPath =
      type === 'BACKUP'
        ? join(outputDir, `${taskNo}.json`)
        : type === 'RESTORE'
          ? resolveBackupPath(outputDir, param ?? '')
          : null;

    const command = this.buildBackupCommand(type, artifactPath, param);

    const task = await this.prisma.backupTask.create({
      data: {
        taskNo,
        type,
        status: 'RUNNING',
        artifactPath,
        restoreFrom: type === 'RESTORE' ? artifactPath : null,
        target: type === 'MIGRATE' ? param ?? null : null,
        command,
        startedAt,
      },
    });

    await this.writeAudit(actor, 'OPS_TASK_START', task.id, {
      taskNo,
      type,
      command,
      restoreFrom: type === 'RESTORE' ? artifactPath : null,
      target: type === 'MIGRATE' ? param ?? null : null,
      ...(approval ? { approval } : {}),
    });

    try {
      let output = '';
      if (type === 'BACKUP') {
        const data = await this.createBackupSnapshot();
        if (!artifactPath) throw new Error('backup path missing');
        await writeFile(artifactPath, JSON.stringify(data, null, 2), 'utf8');
        output = `backup snapshot written: ${artifactPath}`;
      } else if (type === 'RESTORE') {
        if (!artifactPath) throw new Error('restore path missing');

        const rollbackPath = join(outputDir, `${taskNo}-rollback-before-restore.json`);
        const rollbackData = await this.createBackupSnapshot();
        await writeFile(rollbackPath, JSON.stringify(rollbackData, null, 2), 'utf8');

        const restoreData = await this.readAndValidateBackupFile(artifactPath);
        await this.applyBackupSnapshot(restoreData);

        output = `restore completed from ${artifactPath}; rollback point: ${rollbackPath}`;
      } else {
        const rollbackPath = join(outputDir, `${taskNo}-rollback-before-migrate.json`);
        const rollbackData = await this.createBackupSnapshot();
        await writeFile(rollbackPath, JSON.stringify(rollbackData, null, 2), 'utf8');

        const cwd = resolve(process.cwd());
        const statusRun = await runProcess(
          process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
          ['--filter', '@enterprise-blog/api', 'prisma', 'migrate', 'status'],
          cwd,
          2 * 60 * 1000,
        );
        const deployRun = await runProcess(
          process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
          ['--filter', '@enterprise-blog/api', 'prisma', 'migrate', 'deploy'],
          cwd,
          3 * 60 * 1000,
        );

        output = [
          `migrate target: ${param ?? 'default'}`,
          `rollback point: ${rollbackPath}`,
          '[migrate status]',
          statusRun.output,
          '[migrate deploy]',
          deployRun.output,
        ].join('\n');
      }

      await this.prisma.backupTask.update({
        where: { id: task.id },
        data: {
          status: 'SUCCESS',
          output,
          finishedAt: new Date(),
        },
      });

      await this.writeAudit(actor, 'OPS_TASK_SUCCESS', task.id, {
        taskNo,
        type,
        ...(approval ? { approval } : {}),
      });

      return { success: true, taskNo, type, artifactPath, output };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown backup task error';
      await this.prisma.backupTask.update({
        where: { id: task.id },
        data: {
          status: 'FAILED',
          error: message,
          finishedAt: new Date(),
        },
      });

      await this.writeAudit(actor, 'OPS_TASK_FAILED', task.id, {
        taskNo,
        type,
        error: message,
        ...(approval ? { approval } : {}),
      });

      return { success: false, taskNo, type, artifactPath, output: '', error: message };
    }
  }

  private async prepareRestore(restoreFromRaw: string): Promise<RestorePreparation> {
    const backupDir = resolve(this.configService.get<string>('app.backupOutputDir') ?? './backups');
    const normalizedPath = resolveBackupPath(backupDir, restoreFromRaw);

    const content = await readFile(normalizedPath, 'utf8');
    const snapshot = parseBackupSnapshot(content);
    const checksum = createHash('sha256').update(content).digest('hex');
    const fileSizeBytes = Buffer.byteLength(content, 'utf8');

    const warnings: string[] = [];
    const snapshotAt = new Date(snapshot.createdAt);
    if (Number.isNaN(snapshotAt.getTime())) {
      warnings.push('snapshot createdAt is invalid date string');
    } else {
      const ageDays = Math.floor((Date.now() - snapshotAt.getTime()) / (24 * 60 * 60 * 1000));
      if (ageDays > 30) warnings.push(`snapshot is ${ageDays} days old`);
    }

    return {
      normalizedPath,
      checksum,
      fileSizeBytes,
      snapshot,
      report: {
        sourceFile: normalizedPath,
        fileSizeBytes,
        checksum,
        snapshotCreatedAt: snapshot.createdAt,
        entities: {
          siteConfigs: snapshot.siteConfigs.length,
          categories: snapshot.categories.length,
          tags: snapshot.tags.length,
          series: snapshot.series.length,
          pages: snapshot.pages.length,
        },
        warnings,
      },
    };
  }

  private async prepareMigrate(targetRaw?: string): Promise<MigratePreparation> {
    const target = normalizeMigrationTarget(targetRaw);
    const cwd = resolve(process.cwd());
    const statusRun = await runProcess(
      process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
      ['--filter', '@enterprise-blog/api', 'prisma', 'migrate', 'status'],
      cwd,
      2 * 60 * 1000,
    );

    const outputLower = statusRun.output.toLowerCase();
    const hasPendingMigrations =
      outputLower.includes('following migration') ||
      outputLower.includes('not yet been applied') ||
      outputLower.includes('pending');

    const warnings: string[] = [];
    if (!hasPendingMigrations) {
      warnings.push('no pending migrations detected; deploy may be no-op');
    }

    return {
      target,
      statusOutput: statusRun.output,
      hasPendingMigrations,
      report: {
        target,
        hasPendingMigrations,
        statusSummary: safeTruncate(statusRun.output, 2000),
        warnings,
      },
    };
  }

  private issueConfirmationToken(
    action: 'RESTORE' | 'MIGRATE',
    fingerprint: string,
    operatorId: string | null,
    initiatorId: string | null,
  ) {
    const now = new Date();
    const ttlSeconds = Math.max(60, this.configService.get<number>('app.opsConfirmTtlSeconds') ?? 900);
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    const payload: ConfirmationPayload = {
      tokenId: randomUUID(),
      action,
      fingerprint,
      issuedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      operatorId,
      initiatorId,
    };

    const secret = this.getConfirmSecret();
    const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const sig = createHmac('sha256', secret).update(data).digest('base64url');

    return {
      tokenId: payload.tokenId,
      token: `${data}.${sig}`,
      expiresAt: payload.expiresAt,
    };
  }

  private async verifyAndConsumeToken(
    action: 'RESTORE' | 'MIGRATE',
    token: string,
    expectedFingerprint: string,
    operatorId: string | null,
  ) {
    const payload = this.verifyConfirmationToken(token);

    if (payload.action !== action) {
      throw new BadRequestException('confirmation token action mismatch');
    }

    if (payload.fingerprint !== expectedFingerprint) {
      throw new BadRequestException('confirmation token is not bound to current precheck result');
    }

    if (new Date(payload.expiresAt).getTime() < Date.now()) {
      throw new BadRequestException('confirmation token expired');
    }

    if (payload.operatorId && operatorId && payload.operatorId !== operatorId) {
      throw new BadRequestException('confirmation token operator mismatch');
    }

    const consumed = await this.prisma.operationLog.findFirst({
      where: {
        module: 'OPS_CONFIRM',
        action: 'TOKEN_CONSUMED',
        resourceId: payload.tokenId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (consumed) {
      throw new BadRequestException('confirmation token already consumed');
    }

    await this.prisma.operationLog.create({
      data: {
        userId: operatorId,
        module: 'OPS_CONFIRM',
        action: 'TOKEN_CONSUMED',
        resourceId: payload.tokenId,
        payload: {
          tokenId: payload.tokenId,
          action,
          consumedAt: new Date().toISOString(),
          initiatorId: payload.initiatorId,
          approverId: operatorId,
        },
      },
    });

    return payload;
  }

  private verifyConfirmationToken(token: string): ConfirmationPayload {
    const [data, sig] = token.split('.');
    if (!data || !sig) {
      throw new BadRequestException('invalid confirmation token format');
    }

    const secret = this.getConfirmSecret();
    const expected = createHmac('sha256', secret).update(data).digest('base64url');
    if (expected !== sig) {
      throw new BadRequestException('invalid confirmation token signature');
    }

    try {
      const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as ConfirmationPayload;
      if (
        !parsed ||
        typeof parsed.tokenId !== 'string' ||
        (parsed.action !== 'RESTORE' && parsed.action !== 'MIGRATE') ||
        typeof parsed.fingerprint !== 'string' ||
        typeof parsed.issuedAt !== 'string' ||
        typeof parsed.expiresAt !== 'string' ||
        (parsed.initiatorId !== null && typeof parsed.initiatorId !== 'string')
      ) {
        throw new Error('invalid token payload');
      }
      return parsed;
    } catch {
      throw new BadRequestException('invalid confirmation token payload');
    }
  }

  private getConfirmSecret() {
    return (
      this.configService.get<string>('app.opsConfirmSecret') ??
      this.configService.get<string>('app.jwtAccessSecret') ??
      'ops-confirm-secret'
    );
  }

  private assertDualApproval(payload: ConfirmationPayload, approverId: string | null) {
    if (!payload.initiatorId || !approverId) {
      throw new BadRequestException('dual-admin approval requires authenticated initiator and approver');
    }
    if (payload.initiatorId === approverId) {
      throw new BadRequestException('dual-admin approval violation: approver must differ from initiator');
    }
  }

  private assertFinalApproverRole(roleCodes?: string[]) {
    if (!roleCodes || !roleCodes.includes('SUPER_ADMIN')) {
      throw new BadRequestException('final approval whitelist violation: only SUPER_ADMIN can confirm');
    }
  }
  private buildBackupCommand(type: BackupTaskType, artifactPath: string | null, param?: string) {
    if (type === 'BACKUP') {
      return `snapshot-db --output ${artifactPath ?? ''}`.trim();
    }
    if (type === 'RESTORE') {
      return `restore-db --input ${param ?? ''}`.trim();
    }
    return `pnpm --filter @enterprise-blog/api prisma migrate deploy --target ${param ?? 'default'}`;
  }

  private async createBackupSnapshot(): Promise<BackupSnapshot> {
    const [siteConfigs, categories, tags, series, pages] = await Promise.all([
      this.prisma.siteConfig.findMany({ where: { deletedAt: null } }),
      this.prisma.category.findMany({ where: { deletedAt: null } }),
      this.prisma.tag.findMany({ where: { deletedAt: null } }),
      this.prisma.series.findMany({ where: { deletedAt: null } }),
      this.prisma.page.findMany({ where: { deletedAt: null } }),
    ]);

    return {
      createdAt: new Date().toISOString(),
      siteConfigs: siteConfigs.map((item) => ({
        key: item.key,
        value: item.value as Prisma.InputJsonValue,
        description: item.description,
        deletedAt: item.deletedAt ? item.deletedAt.toISOString() : null,
      })),
      categories: categories.map((item) => ({
        id: item.id,
        parentId: item.parentId,
        name: item.name,
        slug: item.slug,
        description: item.description,
        sortOrder: item.sortOrder,
        deletedAt: item.deletedAt ? item.deletedAt.toISOString() : null,
      })),
      tags: tags.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        deletedAt: item.deletedAt ? item.deletedAt.toISOString() : null,
      })),
      series: series.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        description: item.description,
        coverUrl: item.coverUrl,
        sortOrder: item.sortOrder,
        deletedAt: item.deletedAt ? item.deletedAt.toISOString() : null,
      })),
      pages: pages.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        content: item.content,
        seoTitle: item.seoTitle,
        seoDescription: item.seoDescription,
        isPublished: item.isPublished,
        deletedAt: item.deletedAt ? item.deletedAt.toISOString() : null,
      })),
    };
  }

  private async readAndValidateBackupFile(filePath: string): Promise<BackupSnapshot> {
    const content = await readFile(filePath, 'utf8');
    return parseBackupSnapshot(content);
  }

  private async applyBackupSnapshot(snapshot: BackupSnapshot) {
    await this.prisma.$transaction(
      async (tx) => {
        for (const item of snapshot.siteConfigs) {
          await tx.siteConfig.upsert({
            where: { key: item.key },
            update: {
              value: item.value,
              description: item.description,
              deletedAt: parseDate(item.deletedAt),
            },
            create: {
              key: item.key,
              value: item.value,
              description: item.description,
              deletedAt: parseDate(item.deletedAt),
            },
          });
        }

        const categoryIds = new Set(snapshot.categories.map((item) => item.id));
        const existingCategories = await tx.category.findMany({ where: { deletedAt: null }, select: { id: true } });

        for (const item of snapshot.categories) {
          await tx.category.upsert({
            where: { id: item.id },
            update: {
              parentId: null,
              name: item.name,
              slug: item.slug,
              description: item.description,
              sortOrder: item.sortOrder,
              deletedAt: parseDate(item.deletedAt),
            },
            create: {
              id: item.id,
              parentId: null,
              name: item.name,
              slug: item.slug,
              description: item.description,
              sortOrder: item.sortOrder,
              deletedAt: parseDate(item.deletedAt),
            },
          });
        }

        for (const item of snapshot.categories) {
          await tx.category.update({
            where: { id: item.id },
            data: {
              parentId: item.parentId,
              deletedAt: parseDate(item.deletedAt),
            },
          });
        }

        for (const row of existingCategories) {
          if (!categoryIds.has(row.id)) {
            await tx.category.update({ where: { id: row.id }, data: { deletedAt: new Date() } });
          }
        }

        const tagIds = new Set(snapshot.tags.map((item) => item.id));
        const existingTags = await tx.tag.findMany({ where: { deletedAt: null }, select: { id: true } });
        for (const item of snapshot.tags) {
          await tx.tag.upsert({
            where: { id: item.id },
            update: {
              name: item.name,
              slug: item.slug,
              description: item.description,
              deletedAt: parseDate(item.deletedAt),
            },
            create: {
              id: item.id,
              name: item.name,
              slug: item.slug,
              description: item.description,
              deletedAt: parseDate(item.deletedAt),
            },
          });
        }
        for (const row of existingTags) {
          if (!tagIds.has(row.id)) {
            await tx.tag.update({ where: { id: row.id }, data: { deletedAt: new Date() } });
          }
        }

        const seriesIds = new Set(snapshot.series.map((item) => item.id));
        const existingSeries = await tx.series.findMany({ where: { deletedAt: null }, select: { id: true } });
        for (const item of snapshot.series) {
          await tx.series.upsert({
            where: { id: item.id },
            update: {
              title: item.title,
              slug: item.slug,
              description: item.description,
              coverUrl: item.coverUrl,
              sortOrder: item.sortOrder,
              deletedAt: parseDate(item.deletedAt),
            },
            create: {
              id: item.id,
              title: item.title,
              slug: item.slug,
              description: item.description,
              coverUrl: item.coverUrl,
              sortOrder: item.sortOrder,
              deletedAt: parseDate(item.deletedAt),
            },
          });
        }
        for (const row of existingSeries) {
          if (!seriesIds.has(row.id)) {
            await tx.series.update({ where: { id: row.id }, data: { deletedAt: new Date() } });
          }
        }

        const pageIds = new Set(snapshot.pages.map((item) => item.id));
        const existingPages = await tx.page.findMany({ where: { deletedAt: null }, select: { id: true } });
        for (const item of snapshot.pages) {
          await tx.page.upsert({
            where: { id: item.id },
            update: {
              title: item.title,
              slug: item.slug,
              content: item.content,
              seoTitle: item.seoTitle,
              seoDescription: item.seoDescription,
              isPublished: item.isPublished,
              deletedAt: parseDate(item.deletedAt),
            },
            create: {
              id: item.id,
              title: item.title,
              slug: item.slug,
              content: item.content,
              seoTitle: item.seoTitle,
              seoDescription: item.seoDescription,
              isPublished: item.isPublished,
              deletedAt: parseDate(item.deletedAt),
            },
          });
        }
        for (const row of existingPages) {
          if (!pageIds.has(row.id)) {
            await tx.page.update({ where: { id: row.id }, data: { deletedAt: new Date() } });
          }
        }
      },
      { timeout: 90 * 1000 },
    );
  }

  private async buildStaticPayload(route: string) {
    if (route === '/') {
      const [articles, announcements] = await Promise.all([
        this.prisma.article.findMany({
          where: { deletedAt: null, status: 'PUBLISHED', visibility: 'PUBLIC' },
          select: { id: true, title: true, slug: true, publishAt: true, views: true },
          orderBy: [{ isPinned: 'desc' }, { publishAt: 'desc' }, { createdAt: 'desc' }],
          take: 30,
        }),
        this.prisma.announcement.findMany({
          where: { deletedAt: null, isActive: true },
          select: { id: true, title: true, content: true, isPopup: true },
          orderBy: [{ createdAt: 'desc' }],
          take: 5,
        }),
      ]);
      return { route, generatedAt: new Date().toISOString(), articles, announcements };
    }

    if (route === '/tags') {
      const tags = await this.prisma.tag.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, slug: true, _count: { select: { articles: true } } },
        orderBy: [{ updatedAt: 'desc' }],
      });
      return { route, generatedAt: new Date().toISOString(), tags };
    }

    if (route === '/timeline') {
      const timeline = await this.prisma.article.findMany({
        where: { deletedAt: null, status: 'PUBLISHED', visibility: 'PUBLIC', publishAt: { not: null } },
        select: { id: true, title: true, slug: true, publishAt: true },
        orderBy: [{ publishAt: 'desc' }],
        take: 200,
      });
      return { route, generatedAt: new Date().toISOString(), timeline };
    }

    if (route === '/moments') {
      const moments = await this.prisma.page.findMany({
        where: { deletedAt: null, slug: { startsWith: 'moment-' }, isPublished: true },
        select: { id: true, title: true, slug: true, createdAt: true },
        orderBy: [{ createdAt: 'desc' }],
        take: 100,
      });
      return { route, generatedAt: new Date().toISOString(), moments };
    }

    if (route === '/friend-links') {
      const links = await this.prisma.friendLink.findMany({
        where: { deletedAt: null, status: 'APPROVED' },
        select: { id: true, name: true, url: true, logo: true, description: true, sortOrder: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });
      return { route, generatedAt: new Date().toISOString(), links };
    }

    const downloads = await this.prisma.downloadResource.findMany({
      where: { deletedAt: null },
      select: { id: true, title: true, description: true, downloadCount: true, accessLevel: true },
      orderBy: [{ createdAt: 'desc' }],
      take: 100,
    });
    return { route, generatedAt: new Date().toISOString(), downloads };
  }

  private async writeAudit(
    actor: OpsActor,
    action: string,
    resourceId: string | null,
    payload: Prisma.InputJsonObject,
  ) {
    await this.prisma.operationLog.create({
      data: {
        userId: actor.userId,
        module: 'OPS',
        action,
        resourceId,
        payload,
        ip: actor.ip,
        userAgent: actor.userAgent,
      },
    });
  }
}

function parseBackupSnapshot(content: string): BackupSnapshot {
  const parsed = JSON.parse(content) as unknown;
  if (!isBackupSnapshot(parsed)) {
    throw new BadRequestException('invalid backup file structure');
  }

  if (parsed.siteConfigs.length === 0 && parsed.categories.length === 0 && parsed.tags.length === 0) {
    throw new BadRequestException('backup file has no meaningful dataset');
  }

  return parsed;
}

function defaultSiteProfile(): SiteProfile {
  return {
    name: 'Enterprise Blog',
    logo: '',
    icp: '',
    copyright: 'Copyright © Enterprise Blog',
  };
}

function parseJsonArray(raw: string) {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [] as string[];
    return value.filter((item): item is string => typeof item === 'string');
  } catch {
    return [] as string[];
  }
}

async function walkFiles(baseDir: string, currentDir: string): Promise<string[]> {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = join(currentDir, entry.name);
    if (entry.isDirectory()) {
      const nested = await walkFiles(baseDir, absolutePath);
      files.push(...nested);
      continue;
    }
    files.push(absolutePath.replace(baseDir, '').replace(/^[/\\]/, '').replace(/\\/g, '/'));
  }

  return files;
}

function buildTaskNo(prefix: string) {
  const now = new Date();
  const pad = (v: number) => `${v}`.padStart(2, '0');
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const suffix = `${Math.floor(Math.random() * 9000 + 1000)}`;
  return `${prefix}-${ts}-${suffix}`;
}

function normalizeBackupType(value?: string): BackupTaskType | null {
  if (value === 'BACKUP' || value === 'RESTORE' || value === 'MIGRATE') return value;
  return null;
}

function normalizeStaticTaskStatus(value?: string): StaticTaskStatus | null {
  if (value === 'RUNNING' || value === 'SUCCESS' || value === 'FAILED') return value;
  return null;
}

function normalizeMigrationTarget(raw?: string) {
  const value = (raw ?? 'default').trim();
  if (!/^[a-zA-Z0-9_-]{1,32}$/.test(value)) {
    throw new BadRequestException('invalid migrate target');
  }
  return value;
}

function resolveBackupPath(backupDir: string, inputPath: string) {
  const resolved = isAbsolute(inputPath) ? resolve(inputPath) : resolve(backupDir, inputPath);
  const normalizedBackupDir = resolve(backupDir);
  if (!resolved.startsWith(normalizedBackupDir)) {
    throw new BadRequestException('restore file must be inside backup output dir');
  }
  return resolved;
}

function parseDate(input: string | null) {
  if (!input) return null;
  const value = new Date(input);
  if (Number.isNaN(value.getTime())) return null;
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isArrayField(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isBackupSnapshot(value: unknown): value is BackupSnapshot {
  if (!isRecord(value)) return false;
  return (
    typeof value.createdAt === 'string' &&
    isArrayField(value.siteConfigs) &&
    isArrayField(value.categories) &&
    isArrayField(value.tags) &&
    isArrayField(value.series) &&
    isArrayField(value.pages)
  );
}

function safeTruncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

function buildFingerprint(action: 'RESTORE' | 'MIGRATE', raw: string) {
  const hash = createHash('sha256').update(raw).digest('hex');
  return `${action}:${hash}`;
}

function requiredConfirmPhrase(action: 'RESTORE' | 'MIGRATE') {
  return action === 'RESTORE' ? 'RESTORE CONFIRM' : 'MIGRATE CONFIRM';
}

function assertConfirmPhrase(action: 'RESTORE' | 'MIGRATE', phrase?: string) {
  const required = requiredConfirmPhrase(action);
  if ((phrase ?? '').trim() !== required) {
    throw new BadRequestException(`invalid confirm phrase, required: ${required}`);
  }
}

function assertApprovalReason(reason?: string) {
  const normalized = (reason ?? '').trim();
  if (normalized.length < 8) {
    throw new BadRequestException('approvalReason is required and must be at least 8 chars');
  }
}

async function runProcess(command: string, args: string[], cwd: string, timeoutMs: number) {
  return new Promise<{ output: string }>((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    let output = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });

    const timer = setTimeout(() => {
      child.kill();
      rejectPromise(new Error(`command timeout: ${command} ${args.join(' ')}`));
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      const merged = [output.trim(), stderr.trim()].filter((item) => item.length > 0).join('\n');
      if (code === 0) {
        resolvePromise({ output: merged });
      } else {
        rejectPromise(new Error(merged || `command failed: ${command} ${args.join(' ')}`));
      }
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      rejectPromise(error);
    });
  });
}
