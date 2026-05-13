import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditCategory } from '@prisma/client';
import { ClerkAuthGuard } from '../common/guards';
import { Audit } from '../common/decorators';
import { UnitService } from './unit.service';

@Controller('units')
@UseGuards(ClerkAuthGuard)
@Audit('unit', AuditCategory.OPERATIONAL)
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Get()
  findAll() {
    return this.unitService.findAll();
  }
}
