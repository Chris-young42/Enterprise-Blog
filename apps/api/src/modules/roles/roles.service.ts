import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async listRoles() {
    const roles = await this.prisma.role.findMany({
      where: { deletedAt: null },
      include: {
        permissions: {
          where: { deletedAt: null },
          include: { permission: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((item) => ({
        id: item.permission.id,
        key: item.permission.key,
        name: item.permission.name,
      })),
    }));
  }
}
