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

  async getSalesStats() {
    // 1. All-time aggregates (excluding CANCELLED)
    const aggregates = await this.prisma.order.aggregate({
      where: {
        status: { not: 'CANCELLED' },
      },
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    const totalRevenue = aggregates._sum.totalAmount?.toNumber() || 0;
    const totalOrders = aggregates._count.id || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 2. Query recent orders for the last 30 days (excluding CANCELLED)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentOrders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { not: 'CANCELLED' },
      },
      include: {
        items: true,
      },
    });

    // 3. Compile daily sales trend for the last 30 days
    const trendMap = new Map<string, { date: string; revenue: number; orders: number }>();
    
    // Initialize Map with keys for every day in the range YYYY-MM-DD
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      trendMap.set(dateString, { date: dateString, revenue: 0, orders: 0 });
    }

    // Populate actual sales data
    for (const order of recentOrders) {
      const dateString = order.createdAt.toISOString().split('T')[0];
      const dayData = trendMap.get(dateString);
      if (dayData) {
        dayData.revenue += order.totalAmount.toNumber();
        dayData.orders += 1;
      }
    }
    const salesTrend = Array.from(trendMap.values());

    // 4. Compile top 5 selling products by quantity/revenue in the last 30 days
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const order of recentOrders) {
      for (const item of order.items) {
        const key = item.productName;
        const existing = productMap.get(key) || { name: item.productName, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.lineTotal.toNumber();
        productMap.set(key, existing);
      }
    }
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 5. Compile promo code usage in the last 30 days
    const promoMap = new Map<string, { code: string; count: number; discount: number }>();
    for (const order of recentOrders) {
      if (order.promoCode) {
        const code = order.promoCode;
        const existing = promoMap.get(code) || { code, count: 0, discount: 0 };
        existing.count += 1;
        existing.discount += order.discountAmount.toNumber();
        promoMap.set(code, existing);
      }
    }
    const promoUsage = Array.from(promoMap.values())
      .sort((a, b) => b.count - a.count);

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      salesTrend,
      topProducts,
      promoUsage,
    };
  }
}

