import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import type { User as ClerkUser } from '@clerk/backend';
import type { AppCustomer, PaginatedResponse } from '@ilumetech/types';
import { buildPaginationMeta, buildPrismaQuery } from '../common/utils';
import { PrismaService } from '../common/prisma/prisma.service';
import type { CustomerQueryDto, UpdateCustomerDto } from './dto';

@Injectable()
export class CustomerService {
  private readonly clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
  });

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CustomerQueryDto): Promise<PaginatedResponse<AppCustomer>> {
    const filters =
      query.isActive !== undefined ? { isActive: query.isActive } : {};

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

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        skip,
        take,
        where,
        orderBy,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers.map((c) => this.mapPrismaCustomer(c)),
      meta: buildPaginationMeta(total, query.page ?? 1, query.limit ?? 20),
    };
  }

  async findOne(customerId: string): Promise<AppCustomer> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException(`Customer ${customerId} not found`);
    return this.mapPrismaCustomer(customer);
  }

  async update(customerId: string, dto: UpdateCustomerDto): Promise<AppCustomer> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException(`Customer ${customerId} not found`);

    await this.applyClerkUpdates(customerId, dto);

    const updated = await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.username !== undefined && { username: dto.username }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return this.mapPrismaCustomer(updated);
  }

  async remove(customerId: string): Promise<void> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException(`Customer ${customerId} not found`);

    await this.callClerk(() => this.clerk.users.deleteUser(customerId));
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { isActive: false },
    });
  }

  // ─── Private Clerk Helpers ──────────────────────────────────────────────────

  private async applyClerkUpdates(
    customerId: string,
    dto: UpdateCustomerDto,
  ): Promise<void> {
    const hasClerkFields =
      dto.firstName !== undefined ||
      dto.lastName !== undefined ||
      dto.username !== undefined;

    const ops: Promise<void>[] = [];
    if (hasClerkFields) ops.push(this.updateClerkFields(customerId, dto));
    if (dto.isActive !== undefined)
      ops.push(this.updateActiveStatus(customerId, dto.isActive));

    await Promise.all(ops);
  }

  private async updateActiveStatus(
    customerId: string,
    isActive: boolean,
  ): Promise<void> {
    if (isActive) {
      await this.callClerk(() => this.clerk.users.unbanUser(customerId));
      return;
    }
    await this.callClerk(() => this.clerk.users.banUser(customerId));
  }

  private async updateClerkFields(
    customerId: string,
    dto: UpdateCustomerDto,
  ): Promise<void> {
    await this.callClerk(() =>
      this.clerk.users.updateUser(customerId, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        username: dto.username,
      }),
    );
  }

  private mapPrismaCustomer(customer: any): AppCustomer {
    return {
      id: customer.id,
      email: customer.email,
      username: customer.username,
      firstName: customer.firstName,
      lastName: customer.lastName,
      imageUrl: customer.imageUrl ?? '',
      isActive: customer.isActive,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
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
