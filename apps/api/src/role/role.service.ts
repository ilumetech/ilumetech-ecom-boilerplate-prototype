import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import type { CreateRoleDto } from './dto/create-role.dto';
import type { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

const ROLE_INCLUDE = { permissions: { include: { permission: true } } } as const;

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({ include: ROLE_INCLUDE, orderBy: { createdAt: 'asc' } });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id }, include: ROLE_INCLUDE });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  create(dto: CreateRoleDto) {
    return this.prisma.role.create({
      data: { name: dto.name, description: dto.description },
      include: ROLE_INCLUDE,
    });
  }

  async updatePermissions(id: string, dto: UpdateRolePermissionsDto) {
    await this.findOne(id);
    await this.replaceRolePermissions(id, dto.permissionIds);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      this.prisma.role.delete({ where: { id } }),
    ]);
  }

  private async replaceRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    const connections = permissionIds.map((permissionId) => ({ roleId, permissionId }));
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({ data: connections }),
    ]);
  }
}
