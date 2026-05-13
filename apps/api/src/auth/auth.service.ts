import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { PrismaService } from '../common/prisma/prisma.service';

export interface MeResponse {
  clerkUserId: string;
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class AuthService implements OnModuleInit {
  private clerk: ReturnType<typeof createClerkClient>;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    this.clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
  }

  async getMe(clerkUserId: string): Promise<MeResponse> {
    const { email, username } = await this.fetchClerkUserInfo(clerkUserId);
    const { roles, permissions } = await this.fetchRolesAndPermissions(clerkUserId);
    return { clerkUserId, email, username, roles, permissions };
  }

  private async fetchClerkUserInfo(clerkUserId: string): Promise<{ email: string; username: string }> {
    const clerkUser = await this.clerk.users.getUser(clerkUserId);
    const primaryEmail = clerkUser.emailAddresses.find(
      (address) => address.id === clerkUser.primaryEmailAddressId,
    );
    return {
      email: primaryEmail?.emailAddress ?? '',
      username: clerkUser.username ?? '',
    };
  }

  private async fetchRolesAndPermissions(
    clerkUserId: string,
  ): Promise<{ roles: string[]; permissions: string[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: clerkUserId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (!user?.role) return { roles: [], permissions: [] };

    const roles = [user.role.name];
    const permissions = user.role.permissions.map((rp) => rp.permission.action);
    return { roles, permissions: [...new Set(permissions)] };
  }
}
