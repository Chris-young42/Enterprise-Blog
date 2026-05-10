import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis | null = null;

  constructor(private readonly configService: ConfigService) {}

  getClient() {
    if (this.client) return this.client;
    const url = this.configService.get<string>('app.redisUrl') ?? '';
    if (!url) return null;
    this.client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    return this.client;
  }

  async evalNumber(lua: string, keys: string[], args: Array<string | number>) {
    const client = this.getClient();
    if (!client) return null;
    try {
      if (client.status === 'wait') {
        await client.connect();
      }
      const result = await client.eval(lua, keys.length, ...keys, ...args);
      if (typeof result === 'number') return result;
      if (typeof result === 'string') {
        const parsed = Number(result);
        if (!Number.isNaN(parsed)) return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  async ping() {
    const client = this.getClient();
    if (!client) return null;
    try {
      if (client.status === 'wait') {
        await client.connect();
      }
      return await client.ping();
    } catch {
      return null;
    }
  }

  async onModuleDestroy() {
    if (!this.client) return;
    await this.client.quit();
    this.client = null;
  }
}
