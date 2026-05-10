import { Injectable } from '@nestjs/common';

const roleCodes = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'VISITOR'] as const;

@Injectable()
export class SystemService {
  getSystemMeta() {
    return {
      name: 'Enterprise Blog',
      version: '0.1.0',
      roles: roleCodes,
      modules: ['content', 'comment', 'user', 'media', 'stats', 'security', 'ops'],
    };
  }
}
