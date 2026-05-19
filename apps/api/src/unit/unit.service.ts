import { Injectable } from '@nestjs/common';
import type { Unit } from '@ilumetech/types';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class UnitService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Unit[]> {
    const units = await this.prisma.unit.findMany({ orderBy: { name: 'asc' } });
    return units.map((u) => ({
      id: u.id,
      name: u.name,
      abbreviation: u.abbreviation,
    }));
  }
}
