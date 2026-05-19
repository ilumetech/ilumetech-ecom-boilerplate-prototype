import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserStats() {
    const [active, inactive] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: false } }),
    ]);

    return { active, inactive, total: active + inactive };
  }

  async getProductStats() {
    const [active, inactive] = await Promise.all([
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.count({ where: { isActive: false } }),
    ]);

    return { active, inactive, total: active + inactive };
  }

  async getCategoryStats() {
    const categories = await this.prisma.productCategory.findMany({
      select: {
        name: true,
        _count: {
          select: { products: true },
        },
      },
    });

    return categories.map((cat) => ({
      name: cat.name,
      value: cat._count.products,
    }));
  }
}
