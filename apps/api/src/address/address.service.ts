import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  async create(customerId: string, dto: CreateAddressDto) {
    // Check if customer exists, if not create them (Clerk sync hook might be pending)
    await this.ensureCustomer(customerId);

    // Count existing addresses to decide if this is the first address
    const existingCount = await this.prisma.customerAddress.count({
      where: { customerId },
    });

    const isFirst = existingCount === 0;
    const shouldBeDefault = isFirst || dto.isDefault === true;

    return this.prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        // Set all other addresses for this customer to default: false
        await tx.customerAddress.updateMany({
          where: { customerId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.customerAddress.create({
        data: {
          ...dto,
          customerId,
          isDefault: shouldBeDefault,
        },
      });
    });
  }

  async findAll(customerId: string) {
    return this.prisma.customerAddress.findMany({
      where: { customerId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: string, customerId: string) {
    const address = await this.prisma.customerAddress.findFirst({
      where: { id, customerId },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    return address;
  }

  async update(id: string, customerId: string, dto: UpdateAddressDto) {
    // Verify ownership
    const address = await this.findOne(id, customerId);

    const shouldBeDefault = dto.isDefault === true;

    return this.prisma.$transaction(async (tx) => {
      if (shouldBeDefault && !address.isDefault) {
        // Set all other addresses to default: false
        await tx.customerAddress.updateMany({
          where: { customerId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.customerAddress.update({
        where: { id },
        data: {
          ...dto,
          isDefault: shouldBeDefault ? true : address.isDefault,
        },
      });
    });
  }

  async remove(id: string, customerId: string) {
    // Verify ownership
    const address = await this.findOne(id, customerId);

    return this.prisma.$transaction(async (tx) => {
      // Delete the address
      const deleted = await tx.customerAddress.delete({
        where: { id },
      });

      // If we deleted the default address, make another one default if available
      if (address.isDefault) {
        const nextAddress = await tx.customerAddress.findFirst({
          where: { customerId },
          orderBy: { createdAt: 'desc' },
        });

        if (nextAddress) {
          await tx.customerAddress.update({
            where: { id: nextAddress.id },
            data: { isDefault: true },
          });
        }
      }

      return deleted;
    });
  }

  async setDefault(id: string, customerId: string) {
    // Verify ownership
    await this.findOne(id, customerId);

    return this.prisma.$transaction(async (tx) => {
      // Set all other addresses to default: false
      await tx.customerAddress.updateMany({
        where: { customerId, isDefault: true },
        data: { isDefault: false },
      });

      // Set target address to default: true
      return tx.customerAddress.update({
        where: { id },
        data: { isDefault: true },
      });
    });
  }

  private async ensureCustomer(customerId: string): Promise<void> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      // Create a skeleton customer if Clerk webhook hasn't processed yet
      // We default the email to empty or clerk id based email
      await this.prisma.customer.create({
        data: {
          id: customerId,
          email: `${customerId}@clerk.local`,
          firstName: 'Customer',
        },
      });
    }
  }
}
