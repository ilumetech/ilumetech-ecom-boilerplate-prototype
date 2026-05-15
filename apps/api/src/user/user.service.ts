import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import type { User as ClerkUser } from '@clerk/backend';
import type { Prisma } from '@prisma/client';
import type { AppUser, AppUserMe, PaginatedResponse } from '@ilumetech/types';
import { buildPaginationMeta, buildPrismaQuery } from '../common/utils';
import { PrismaService } from '../common/prisma/prisma.service';
import type { AssignRoleDto } from './dto/assign-role.dto';
import type { InviteUserDto } from './dto/invite-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UserQueryDto } from './dto/user-query.dto';

type UserWithRole = Prisma.UserGetPayload<{ include: { role: true } }>;

type UserWithRoleAndPermissions = Prisma.UserGetPayload<{
  include: { role: { include: { permissions: { include: { permission: true } } } } };
}>;

@Injectable()
export class UserService {
  private readonly clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

  // Error throwing pattern — use NestJS exceptions, never raw Error:
  // ✓ throw new ConflictException('Transaksi sudah ada, produk tidak bisa dihapus.')
  // ✓ throw new NotFoundException('Produk tidak ditemukan.')
  // ✓ throw new BadRequestException('Stok tidak mencukupi.')
  // ✗ throw new Error('something went wrong')

  constructor(private readonly prisma: PrismaService) {}

  // ─── Public CRUD ──────────────────────────────────────────────────────────

  async findMe(clerkUserId: string): Promise<AppUserMe> {
    let user = await this.prisma.user.findUnique({
      where: { id: clerkUserId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    // If user not in DB, sync from Clerk (this handles users who signed up before the DB sync was ready)
    if (!user) {
      const clerkUser = await this.callClerk(() => this.clerk.users.getUser(clerkUserId));
      await this.syncClerkUserToPostgres(clerkUser);
      
      // Fetch again with permissions
      user = await this.prisma.user.findUnique({
        where: { id: clerkUserId },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      }) as UserWithRoleAndPermissions;
    }

    if (!user) throw new NotFoundException(`User ${clerkUserId} not found`);
    return this.mapPrismaUserMe(user);
  }

  async findAll(query: UserQueryDto): Promise<PaginatedResponse<AppUser>> {
    const filters = query.isActive !== undefined ? { isActive: query.isActive } : {};

    const { skip, take, where, orderBy } = buildPrismaQuery({
      search: query.search,
      searchFields: ['email', 'username', 'firstName', 'lastName'],
      filters,
      sortField: query.sortField,
      sortOrder: query.sortOrder,
      allowedSortFields: ['email', 'firstName', 'lastName', 'createdAt'],
      page: query.page,
      limit: query.limit,
    });

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({ skip, take, where, orderBy, include: { role: true } }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u) => this.mapPrismaUser(u)),
      meta: buildPaginationMeta(total, query.page ?? 1, query.limit ?? 20),
    };
  }

  async findOne(userId: string): Promise<AppUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    return this.mapPrismaUser(user);
  }

  async create(dto: InviteUserDto): Promise<AppUser> {
    const clerkUser = await this.callClerk(() =>
      this.clerk.users.createUser({
        username: dto.username,
        emailAddress: [dto.email],
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
      }),
    );

    const user = await this.syncClerkUserToPostgres(clerkUser, dto.roleId);
    return this.mapPrismaUser(user);
  }

  async update(userId: string, dto: UpdateUserDto): Promise<AppUser> {
    await this.applyClerkUpdates(userId, dto);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.username !== undefined && { username: dto.username }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.roleId !== undefined && { roleId: dto.roleId }),
      },
      include: { role: true },
    });

    return this.mapPrismaUser(user);
  }

  async remove(userId: string): Promise<void> {
    await this.callClerk(() => this.clerk.users.deleteUser(userId));
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  // ─── Role endpoints ────────────────────────────────────────────────────────

  async getUserRoles(clerkUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: clerkUserId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (!user?.role) return [];
    return [{ clerkUserId: user.id, roleId: user.roleId, role: user.role, createdAt: user.createdAt }];
  }

  async assignRole(clerkUserId: string, dto: AssignRoleDto) {
    const user = await this.prisma.user.findUnique({ where: { id: clerkUserId } });
    if (!user) throw new NotFoundException(`User ${clerkUserId} not found`);

    return this.prisma.user.update({
      where: { id: clerkUserId },
      data: { roleId: dto.roleId },
      include: { role: true },
    });
  }

  async removeRole(clerkUserId: string, roleId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: clerkUserId } });
    if (!user) throw new NotFoundException(`User ${clerkUserId} not found`);
    if (user.roleId !== roleId) throw new NotFoundException(`Role ${roleId} not assigned to user ${clerkUserId}`);

    await this.prisma.user.update({
      where: { id: clerkUserId },
      data: { roleId: null },
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async syncClerkUserToPostgres(clerkUser: ClerkUser, roleId?: string): Promise<UserWithRole> {
    const primaryEmail = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    );

    // Auto-assign admin role to the first user if no role is provided
    let effectiveRoleId = roleId;
    if (!effectiveRoleId) {
      const userCount = await this.prisma.user.count();
      if (userCount === 0) {
        const adminRole = await this.prisma.role.findUnique({ where: { name: 'admin' } });
        if (adminRole) effectiveRoleId = adminRole.id;
      }
    }

    const data = {
      email: primaryEmail?.emailAddress ?? '',
      username: clerkUser.username,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      isActive: !clerkUser.banned,
      ...(effectiveRoleId !== undefined && { roleId: effectiveRoleId }),
    };

    return this.prisma.user.upsert({
      where: { id: clerkUser.id },
      update: data,
      create: { id: clerkUser.id, createdAt: new Date(clerkUser.createdAt), ...data },
      include: { role: true },
    });
  }

  private async applyClerkUpdates(userId: string, dto: UpdateUserDto): Promise<void> {
    const hasClerkFields =
      dto.firstName !== undefined || dto.lastName !== undefined || dto.username !== undefined;

    const ops: Promise<void>[] = [];
    if (hasClerkFields) ops.push(this.updateClerkFields(userId, dto));
    if (dto.isActive !== undefined) ops.push(this.updateActiveStatus(userId, dto.isActive));

    await Promise.all(ops);
  }

  private async updateActiveStatus(userId: string, isActive: boolean): Promise<void> {
    if (isActive) {
      await this.callClerk(() => this.clerk.users.unbanUser(userId));
      return;
    }
    await this.callClerk(() => this.clerk.users.banUser(userId));
  }

  private async updateClerkFields(userId: string, dto: UpdateUserDto): Promise<void> {
    await this.callClerk(() =>
      this.clerk.users.updateUser(userId, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        username: dto.username,
      }),
    );
  }

  private mapPrismaUserMe(user: UserWithRoleAndPermissions): AppUserMe {
    const permissionNames = user.role?.permissions.map((rp) => rp.permission.action) ?? [];
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl ?? '',
      createdAt: user.createdAt.toISOString(),
      isActive: user.isActive,
      primaryRole: user.role?.name ?? null,
      permissions: [...new Set(permissionNames)],
    };
  }

  private mapPrismaUser(user: UserWithRole): AppUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl ?? '',
      createdAt: user.createdAt.toISOString(),
      isActive: user.isActive,
      primaryRole: user.role?.name ?? null,
    };
  }

  private async callClerk<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      throw this.normalizeClerkError(error);
    }
  }

  private normalizeClerkError(error: unknown): Error {
    const clerkError = error as { errors?: { message: string }[] };
    const firstMessage = clerkError.errors?.[0]?.message;
    if (firstMessage) return new BadRequestException(firstMessage);
    return new InternalServerErrorException('Clerk API error');
  }
}
