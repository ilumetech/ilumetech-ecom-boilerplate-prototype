import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProductOptionDto, UpdateProductOptionDto } from './dto';

@Injectable()
export class ProductOptionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(productId: string) {
    return this.prisma.productOption.findMany({
      where: { productId },
      include: { values: true },
      orderBy: { position: 'asc' },
    });
  }

  async create(productId: string, dto: CreateProductOptionDto) {
    const existing = await this.prisma.productOption.findUnique({
      where: { productId_name: { productId, name: dto.name } },
    });
    if (existing) throw new BadRequestException(`Option ${dto.name} already exists for this product`);

    return this.prisma.productOption.create({
      data: {
        productId,
        name: dto.name,
        position: dto.position ?? 0,
        values: {
          create: dto.values?.map((v) => ({
            value: v.value,
            position: v.position ?? 0,
          })),
        },
      },
      include: { values: true },
    });
  }

  async update(productId: string, optionId: string, dto: UpdateProductOptionDto) {
    const option = await this.prisma.productOption.findFirst({
      where: { id: optionId, productId },
    });
    if (!option) throw new NotFoundException(`Option ${optionId} not found for this product`);

    if (dto.name && dto.name !== option.name) {
      const existing = await this.prisma.productOption.findUnique({
        where: { productId_name: { productId, name: dto.name } },
      });
      if (existing) throw new BadRequestException(`Option ${dto.name} already exists for this product`);
    }

    return this.prisma.productOption.update({
      where: { id: optionId },
      data: dto,
      include: { values: true },
    });
  }

  async remove(productId: string, optionId: string) {
    const option = await this.prisma.productOption.findFirst({
      where: { id: optionId, productId },
      include: { values: { include: { variants: true } } },
    });
    if (!option) throw new NotFoundException(`Option ${optionId} not found for this product`);

    // Check if any value is used in variants
    const isUsed = option.values.some((v) => v.variants.length > 0);
    if (isUsed) throw new BadRequestException(`Cannot delete option ${option.name} because it is used by variants`);

    await this.prisma.productOption.delete({ where: { id: optionId } });
  }
}
