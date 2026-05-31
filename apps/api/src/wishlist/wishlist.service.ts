import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ProductService } from '../product/product.service';

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productService: ProductService,
  ) {}

  async toggle(customerId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        customerId_productId: {
          customerId,
          productId,
        },
      },
    });

    if (existing) {
      await this.prisma.wishlistItem.delete({
        where: {
          customerId_productId: {
            customerId,
            productId,
          },
        },
      });
      return { wishlisted: false };
    } else {
      await this.ensureCustomerExists(customerId);
      
      await this.prisma.wishlistItem.create({
        data: {
          customerId,
          productId,
        },
      });
      return { wishlisted: true };
    }
  }

  async getWishlist(customerId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { customerId },
      include: {
        product: {
          include: {
            productCategory: true,
            unit: true,
            images: {
              orderBy: {
                sortOrder: 'asc',
              },
            },
            options: {
              include: {
                values: {
                  orderBy: {
                    position: 'asc',
                  },
                },
              },
              orderBy: {
                position: 'asc',
              },
            },
            variants: {
              include: {
                optionValues: {
                  include: {
                    optionValue: {
                      include: {
                        option: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      data: items.map((item) => this.productService.mapToPublicResponse(item.product)),
    };
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
