import { Controller, Get } from '@nestjs/common';

interface HealthResponse {
  status: string;
  timestamp: string;
}

@Controller()
export class AppController {
  @Get('health')
  getHealth(): HealthResponse {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
