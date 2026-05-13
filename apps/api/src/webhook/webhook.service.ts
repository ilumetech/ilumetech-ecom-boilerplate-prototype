import { BadRequestException, Injectable } from '@nestjs/common';
import { Webhook } from 'svix';
import type { UserJSON, UserDeletedJSON, WebhookEvent } from '@clerk/backend';
import { PrismaService } from '../common/prisma/prisma.service';

type SvixHeaders = {
  'svix-id': string;
  'svix-timestamp': string;
  'svix-signature': string;
};

@Injectable()
export class WebhookService {
  constructor(private readonly prisma: PrismaService) {}

  async handleEvent(rawBody: Buffer, headers: SvixHeaders, event: WebhookEvent): Promise<void> {
    this.verifySignature(rawBody, headers);
    await this.routeEvent(event);
  }

  private verifySignature(rawBody: Buffer, headers: SvixHeaders): void {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
    try {
      wh.verify(rawBody, headers);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  private async routeEvent(event: WebhookEvent): Promise<void> {
    if (event.type === 'user.deleted') {
      const data = event.data as UserDeletedJSON;
      if (data.id) await this.softDeleteUser(data.id);
      return;
    }
    if (event.type === 'user.created' || event.type === 'user.updated') {
      await this.upsertUser(event.data as UserJSON);
    }
  }

  private async upsertUser(data: UserJSON): Promise<void> {
    const primaryEmail = data.email_addresses.find(
      (e) => e.id === data.primary_email_address_id,
    );

    const userData = {
      email: primaryEmail?.email_address ?? '',
      username: data.username,
      firstName: data.first_name,
      lastName: data.last_name,
      imageUrl: data.image_url,
      isActive: !data.banned,
    };

    await this.prisma.user.upsert({
      where: { id: data.id },
      update: userData,
      create: { id: data.id, createdAt: new Date(data.created_at), ...userData },
    });
  }

  private async softDeleteUser(id: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id },
      data: { isActive: false },
    });
  }
}
