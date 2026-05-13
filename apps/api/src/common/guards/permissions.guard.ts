import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedRequest } from '../types/clerk.types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.getRequiredPermissions(context);
    if (!requiredPermissions.length) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userPermissions = await this.resolveUserPermissions(request);
    const hasAllPermissions = requiredPermissions.every((p) => userPermissions.includes(p));

    if (!hasAllPermissions) throw new ForbiddenException('Insufficient permissions');
    return true;
  }

  private getRequiredPermissions(context: ExecutionContext): string[] {
    return (
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? []
    );
  }

  private async resolveUserPermissions(request: AuthenticatedRequest): Promise<string[]> {
    if (request.resolvedPermissions) return request.resolvedPermissions;

    const userPermissions = await this.fetchPermissionsFromDatabase(request.user.sub);
    request.resolvedPermissions = userPermissions;
    return userPermissions;
  }

  private async fetchPermissionsFromDatabase(clerkUserId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: clerkUserId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (!user?.role) throw new ForbiddenException('No role assigned to user');

    const allActions = user.role.permissions.map((rp) => rp.permission.action);
    return [...new Set(allActions)];
  }
}
