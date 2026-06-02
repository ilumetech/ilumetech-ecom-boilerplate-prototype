import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ReviewStatus, OrderStatus } from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';
import { buildPaginationMeta, buildPrismaQuery } from '../common/utils';

@Injectable()
export class ProductReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async checkCanReview(customerId: string, productId: string): Promise<boolean> {
    const count = await this.prisma.order.count({
      where: {
        customerId,
        status: OrderStatus.COMPLETED,
        items: {
          some: {
            productId,
          },
        },
      },
    });
    return count > 0;
  }

  async submit(customerId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    const canReview = await this.checkCanReview(customerId, dto.productId);
    if (!canReview) {
      throw new BadRequestException(
        'You can only review products you have successfully purchased.',
      );
    }

    await this.ensureCustomerExists(customerId);

    const existingReview = await this.prisma.productReview.findFirst({
      where: {
        customerId,
        productId: dto.productId,
      },
    });

    if (existingReview) {
      return this.prisma.productReview.update({
        where: { id: existingReview.id },
        data: {
          rating: dto.rating,
          comment: dto.comment,
          status: ReviewStatus.PENDING,
        },
        include: {
          customer: true,
        },
      });
    }

    const review = await this.prisma.productReview.create({
      data: {
        customerId,
        productId: dto.productId,
        rating: dto.rating,
        comment: dto.comment,
        status: ReviewStatus.PENDING,
      },
      include: {
        customer: true,
      },
    });

    return review;
  }

  async getProductReviews(productId: string) {
    const reviews = await this.prisma.productReview.findMany({
      where: {
        productId,
        status: ReviewStatus.APPROVED,
        customer: {
          isActive: true,
        },
      },
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalCount = reviews.length;
    let sum = 0;
    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviews.forEach((r) => {
      sum += r.rating;
      const ratingKey = r.rating as 1 | 2 | 3 | 4 | 5;
      if (starCounts[ratingKey] !== undefined) {
        starCounts[ratingKey]++;
      }
    });

    const averageRating = totalCount > 0 ? Number((sum / totalCount).toFixed(1)) : 0;

    const distribution = [5, 4, 3, 2, 1].map((star) => {
      const count = starCounts[star as 1 | 2 | 3 | 4 | 5] || 0;
      const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
      return { rating: star, count, percentage };
    });

    return {
      reviews,
      averageRating,
      totalCount,
      distribution,
    };
  }

  async findAll(query: QueryReviewDto) {
    const filters: Record<string, unknown> = {};
    if (query.status) filters.status = query.status;
    if (query.productId) filters.productId = query.productId;

    const { skip, take, where, orderBy } = buildPrismaQuery({
      search: query.search,
      searchFields: ['comment'],
      filters,
      sortField: query.sortField,
      sortOrder: query.sortOrder,
      allowedSortFields: ['createdAt', 'rating'],
      page: query.page,
      limit: query.limit,
    });

    const [data, total] = await Promise.all([
      this.prisma.productReview.findMany({
        skip,
        take,
        where,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: {
          customer: true,
          product: true,
        },
      }),
      this.prisma.productReview.count({ where }),
    ]);

    return {
      data,
      meta: buildPaginationMeta(total, query.page ?? 1, query.limit ?? 10),
    };
  }

  async updateStatus(id: string, status: ReviewStatus) {
    const review = await this.prisma.productReview.findUnique({
      where: { id },
    });
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    const updated = await this.prisma.productReview.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        product: true,
      },
    });

    return updated;
  }

  private async ensureCustomerExists(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    
    if (!customer) {
      await this.prisma.customer.create({
        data: {
          id: customerId,
          email: `${customerId}@clerk-user.local`,
          firstName: 'Storefront',
          lastName: 'Customer',
        },
      });
    }
  }
}
