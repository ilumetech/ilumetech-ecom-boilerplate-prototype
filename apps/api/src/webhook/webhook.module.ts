import { Module, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Readable } from 'stream';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { PrismaModule } from '../common/prisma/prisma.module';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

@Module({
  imports: [PrismaModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule implements OnModuleInit {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  onModuleInit(): void {
    const fastify =
      this.httpAdapterHost.httpAdapter.getInstance<FastifyInstance>();
    fastify.addHook('preParsing', async (request, _reply, payload) => {
      if (request.url !== '/webhooks/clerk') return payload;

      const chunks: Buffer[] = [];
      for await (const chunk of payload) {
        chunks.push(
          Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)),
        );
      }

      const rawBody = Buffer.concat(chunks);
      (request as FastifyRequest & { rawBody: Buffer }).rawBody = rawBody;

      return Readable.from(rawBody);
    });
  }
}
