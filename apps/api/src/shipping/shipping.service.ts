import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma, ShippingRate } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import type { QueryShippingDestinationDto, ShippingQuoteDto } from './dto';

const DEFAULT_PRODUCT_WEIGHT_GRAM = 1000;

interface WeightedItem {
  quantity: number;
  weightGram: number | null;
}

export interface ShippingQuote {
  courier: 'JNE';
  service: string;
  shipmentType: string;
  destinationCode: string;
  destinationLabel: string;
  weightGram: number;
  chargeableWeightKg: number;
  amount: number;
  etd: string | null;
}

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  async findDestinations(query: QueryShippingDestinationDto) {
    const search = query.search?.trim();
    const destinations = await this.prisma.shippingRate.findMany({
      where: this.buildDestinationFilter(search),
      select: {
        destinationCode: true,
        destinationLabel: true,
      },
      distinct: ['destinationCode'],
      orderBy: { destinationLabel: 'asc' },
    });
    const start = (query.page - 1) * query.limit;
    const data = destinations.slice(start, start + query.limit);

    return {
      data,
      meta: this.buildPaginationMeta(query, destinations.length),
    };
  }

  async quote(dto: ShippingQuoteDto): Promise<ShippingQuote[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: {
        id: { in: dto.items.map((item) => item.productVariantId) },
        isActive: true,
        product: { isActive: true },
      },
      select: {
        id: true,
        product: { select: { weightGram: true } },
      },
    });
    if (variants.length !== dto.items.length) {
      throw new BadRequestException('One or more cart items are unavailable');
    }

    const weightByVariant = new Map(
      variants.map((variant) => [variant.id, variant.product.weightGram]),
    );
    const items = dto.items.map((item) => ({
      quantity: item.quantity,
      weightGram: weightByVariant.get(item.productVariantId) ?? null,
    }));

    return this.getQuotes(this.prisma, dto.destinationCode, items);
  }

  async getQuote(
    client: Prisma.TransactionClient,
    destinationCode: string,
    service: string,
    items: WeightedItem[],
  ): Promise<ShippingQuote> {
    const quotes = await this.getQuotes(client, destinationCode, items);
    const quote = quotes.find((option) => option.service === service);

    if (!quote) {
      throw new BadRequestException('Selected shipping service is unavailable');
    }

    return quote;
  }

  private async getQuotes(
    client: Prisma.TransactionClient | PrismaService,
    destinationCode: string,
    items: WeightedItem[],
  ): Promise<ShippingQuote[]> {
    const rates = await client.shippingRate.findMany({
      where: {
        destinationCode,
        NOT: { shipmentType: 'Document' },
      },
      orderBy: [{ tariffIdr: 'asc' }, { service: 'asc' }],
    });

    if (rates.length === 0) {
      throw new BadRequestException('Shipping destination is unavailable');
    }

    const weightGram = this.calculateWeight(items);
    const chargeableWeightKg = Math.max(1, Math.ceil(weightGram / 1000));

    return rates.map((rate) =>
      this.mapQuote(rate, weightGram, chargeableWeightKg),
    );
  }

  private buildDestinationFilter(
    search?: string,
  ): Prisma.ShippingRateWhereInput | undefined {
    if (!search) return undefined;

    return {
      OR: [
        { destinationCode: { contains: search, mode: 'insensitive' } },
        { destinationLabel: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  private buildPaginationMeta(
    query: QueryShippingDestinationDto,
    total: number,
  ) {
    return {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  private mapQuote(
    rate: ShippingRate,
    weightGram: number,
    chargeableWeightKg: number,
  ): ShippingQuote {
    return {
      courier: 'JNE',
      service: rate.service,
      shipmentType: rate.shipmentType,
      destinationCode: rate.destinationCode,
      destinationLabel: rate.destinationLabel,
      weightGram,
      chargeableWeightKg,
      amount: rate.tariffIdr * chargeableWeightKg,
      etd: rate.etd,
    };
  }

  private calculateWeight(items: WeightedItem[]): number {
    return items.reduce((total, item) => {
      const weight = item.weightGram ?? DEFAULT_PRODUCT_WEIGHT_GRAM;
      return total + weight * item.quantity;
    }, 0);
  }
}
