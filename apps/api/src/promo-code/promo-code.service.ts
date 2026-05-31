import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { PaginatedResponse, PromoCode } from '@ilumetech/types';
import { PrismaService } from '../common/prisma/prisma.service';
import { buildPaginationMeta, buildPrismaQuery } from '../common/utils';
import {
  CreatePromoCodeDto,
  QueryPromoCodeDto,
  UpdatePromoCodeDto,
  ValidatePromoCodeDto,
} from './dto';

type PrismaPromoCode = Prisma.PromoCodeGetPayload<{}>;

@Injectable()
export class PromoCodeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryPromoCodeDto,
  ): Promise<PaginatedResponse<PromoCode>> {
    const { skip, take, where, orderBy } = buildPrismaQuery({
      search: query.search,
      searchFields: ['code', 'description'],
      filters: {},
      sortField: query.sortField,
      sortOrder: query.sortOrder,
      allowedSortFields: ['code', 'createdAt'],
      page: query.page,
      limit: query.limit,
    });

    const [promos, total] = await Promise.all([
      this.prisma.promoCode.findMany({ skip, take, where, orderBy }),
      this.prisma.promoCode.count({ where }),
    ]);

    return {
      data: promos.map((p) => this.mapToResponse(p)),
      meta: buildPaginationMeta(total, query.page ?? 1, query.limit ?? 10),
    };
  }

  async findOne(id: string): Promise<PromoCode> {
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });

    if (!promo) {
      throw new NotFoundException(`Promo code with ID ${id} not found`);
    }

    return this.mapToResponse(promo);
  }

  async create(dto: CreatePromoCodeDto): Promise<PromoCode> {
    const codeUpper = dto.code.trim().toUpperCase();

    const existing = await this.prisma.promoCode.findUnique({
      where: { code: codeUpper },
    });

    if (existing) {
      throw new BadRequestException(`Promo code "${codeUpper}" already exists`);
    }

    const promo = await this.prisma.promoCode.create({
      data: {
        code: codeUpper,
        description: dto.description,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderAmount: dto.minOrderAmount ?? 0,
        maxDiscount: dto.maxDiscount,
        usageLimit: dto.usageLimit,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: dto.isActive ?? true,
      },
    });

    return this.mapToResponse(promo);
  }

  async update(id: string, dto: UpdatePromoCodeDto): Promise<PromoCode> {
    await this.findOne(id);

    const data: Prisma.PromoCodeUpdateInput = {
      description: dto.description,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      minOrderAmount: dto.minOrderAmount,
      maxDiscount: dto.maxDiscount,
      usageLimit: dto.usageLimit,
      isActive: dto.isActive,
    };

    if (dto.code) {
      const codeUpper = dto.code.trim().toUpperCase();
      const existing = await this.prisma.promoCode.findFirst({
        where: {
          code: codeUpper,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Promo code "${codeUpper}" already exists`,
        );
      }

      data.code = codeUpper;
    }

    if (dto.startDate) {
      data.startDate = new Date(dto.startDate);
    }

    if (dto.endDate !== undefined) {
      data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }

    const promo = await this.prisma.promoCode.update({
      where: { id },
      data,
    });

    return this.mapToResponse(promo);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.promoCode.delete({ where: { id } });
  }

  async validateCode(dto: ValidatePromoCodeDto) {
    const codeUpper = dto.code.trim().toUpperCase();

    const promo = await this.prisma.promoCode.findUnique({
      where: { code: codeUpper },
    });

    if (!promo) {
      throw new BadRequestException('Kode promo tidak valid');
    }

    if (!promo.isActive) {
      throw new BadRequestException('Kode promo sudah tidak aktif');
    }

    const now = new Date();

    if (promo.startDate && now < promo.startDate) {
      throw new BadRequestException('Periode promo belum dimulai');
    }

    if (promo.endDate && now > promo.endDate) {
      throw new BadRequestException('Kode promo sudah kadaluwarsa');
    }

    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      throw new BadRequestException('Batas penggunaan kode promo telah habis');
    }

    const minOrderAmount = promo.minOrderAmount.toNumber();
    if (dto.subtotal < minOrderAmount) {
      throw new BadRequestException(
        `Minimal pembelian untuk promo ini adalah Rp ${minOrderAmount.toLocaleString(
          'id-ID',
        )}`,
      );
    }

    let discountAmount = 0;
    const discountValue = promo.discountValue.toNumber();

    if (promo.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((dto.subtotal * discountValue) / 100);
      if (promo.maxDiscount !== null) {
        const maxDiscount = promo.maxDiscount.toNumber();
        discountAmount = Math.min(discountAmount, maxDiscount);
      }
    } else {
      discountAmount = discountValue;
    }

    discountAmount = Math.min(discountAmount, dto.subtotal);

    return {
      code: promo.code,
      discountType: promo.discountType,
      discountValue: discountValue,
      discountAmount,
      finalPrice: dto.subtotal - discountAmount,
    };
  }

  async incrementUsage(code: string): Promise<void> {
    const codeUpper = code.trim().toUpperCase();
    await this.prisma.promoCode.update({
      where: { code: codeUpper },
      data: {
        usedCount: { increment: 1 },
      },
    });
  }

  private mapToResponse(promo: PrismaPromoCode): PromoCode {
    return {
      id: promo.id,
      code: promo.code,
      description: promo.description,
      discountType: promo.discountType,
      discountValue: promo.discountValue.toNumber(),
      minOrderAmount: promo.minOrderAmount.toNumber(),
      maxDiscount: promo.maxDiscount ? promo.maxDiscount.toNumber() : null,
      usageLimit: promo.usageLimit,
      usedCount: promo.usedCount,
      startDate: promo.startDate.toISOString(),
      endDate: promo.endDate ? promo.endDate.toISOString() : null,
      isActive: promo.isActive,
      createdAt: promo.createdAt.toISOString(),
      updatedAt: promo.updatedAt.toISOString(),
    };
  }
}
