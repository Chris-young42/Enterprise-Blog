import { PrismaClient, RoleCode, type Permission } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type RoleDefinition = {
  code: RoleCode;
  name: string;
  description: string;
};

async function main() {
  const roleDefinitions: RoleDefinition[] = [
    { code: 'SUPER_ADMIN', name: 'Super Admin', description: 'Global full access role' },
    { code: 'ADMIN', name: 'Admin', description: 'Site management role' },
    { code: 'EDITOR', name: 'Editor', description: 'Content editing and moderation role' },
    { code: 'AUTHOR', name: 'Author', description: 'Content writing role' },
    { code: 'VISITOR', name: 'Visitor', description: 'Basic member role' },
  ];

  for (const role of roleDefinitions) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        deletedAt: null,
      },
      create: {
        code: role.code,
        name: role.name,
        description: role.description,
      },
    });
  }

  const permissionDefinitions: Array<{ key: string; name: string }> = [
    { key: 'user:profile:update', name: 'Update own profile' },
    { key: 'content:category:manage', name: 'Manage categories' },
    { key: 'content:tag:manage', name: 'Manage tags' },
    { key: 'content:series:manage', name: 'Manage series' },
    { key: 'system:role:read', name: 'Read role permissions' },
    { key: 'system:all', name: 'System full access' },
  ];

  for (const permission of permissionDefinitions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { name: permission.name, deletedAt: null },
      create: permission,
    });
  }

  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { code: 'SUPER_ADMIN' },
    select: { id: true },
  });
  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { code: 'ADMIN' },
    select: { id: true },
  });
  const editorRole = await prisma.role.findUniqueOrThrow({
    where: { code: 'EDITOR' },
    select: { id: true },
  });
  const authorRole = await prisma.role.findUniqueOrThrow({
    where: { code: 'AUTHOR' },
    select: { id: true },
  });
  const visitorRole = await prisma.role.findUniqueOrThrow({
    where: { code: 'VISITOR' },
    select: { id: true },
  });

  const allPermissions: Pick<Permission, 'id' | 'key'>[] = await prisma.permission.findMany({
    where: { deletedAt: null },
    select: { id: true, key: true },
  });

  const assignRolePermissions = async (roleId: string, keys: string[]) => {
    for (const key of keys) {
      const permission = allPermissions.find((item) => item.key === key);
      if (!permission) {
        continue;
      }
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId: permission.id,
          },
        },
        update: { deletedAt: null },
        create: {
          roleId,
          permissionId: permission.id,
        },
      });
    }
  };

  await assignRolePermissions(superAdminRole.id, allPermissions.map((item) => item.key));
  await assignRolePermissions(adminRole.id, [
    'content:category:manage',
    'content:tag:manage',
    'content:series:manage',
    'system:role:read',
  ]);
  await assignRolePermissions(editorRole.id, [
    'content:category:manage',
    'content:tag:manage',
    'content:series:manage',
  ]);
  await assignRolePermissions(authorRole.id, ['user:profile:update']);
  await assignRolePermissions(visitorRole.id, ['user:profile:update']);

  const passwordHash = await bcrypt.hash('Admin@123456', 12);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      email: 'admin@enterprise-blog.local',
      nickname: 'System Admin',
      passwordHash,
      deletedAt: null,
    },
    create: {
      username: 'admin',
      email: 'admin@enterprise-blog.local',
      nickname: 'System Admin',
      passwordHash,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
      },
    },
    update: {
      deletedAt: null,
    },
    create: {
      userId: adminUser.id,
      roleId: superAdminRole.id,
    },
  });

  console.log('Seed completed: roles, permissions, admin user initialized.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
