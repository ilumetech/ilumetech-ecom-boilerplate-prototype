import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { WebhookEvent } from '@clerk/backend';
import { WebhookService } from './webhook.service';

type RawBodyRequest = FastifyRequest & { rawBody?: Buffer };

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('clerk')
  async handleClerkWebhook(
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
    @Req() request: RawBodyRequest,
    @Body() body: WebhookEvent,
  ): Promise<void> {
    if (!request.rawBody) throw new BadRequestException('Missing raw body');

    await this.webhookService.handleEvent(
      request.rawBody,
      {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      },
      body,
    );
  }

  @Post('midtrans')
  async handleMidtransWebhook(
    @Body() body: any,
  ): Promise<{ status: string }> {
    await this.webhookService.handleMidtransNotification(body);
    return { status: 'ok' };
  }
}
