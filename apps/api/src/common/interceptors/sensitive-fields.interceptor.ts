import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import { SENSITIVE_FIELDS_KEY } from '../decorators/sensitive-fields.decorator';
import type { AuthenticatedRequest } from '../types/clerk.types';
import type { ClerkUser } from '../types/clerk.types';

type SensitiveFieldsRequest = Omit<AuthenticatedRequest, 'user'> & {
  user?: ClerkUser;
};

@Injectable()
export class SensitiveFieldsInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const fieldPermissions = this.reflector.getAllAndOverride<Record<string, string>>(
      SENSITIVE_FIELDS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!fieldPermissions || Object.keys(fieldPermissions).length === 0) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<SensitiveFieldsRequest>();

    return next.handle().pipe(
      switchMap(async (body) => {
        const userPermissions = await this.resolvePermissions(request);
        return this.stripSensitiveFields(body, fieldPermissions, userPermissions);
      }),
    );
  }

  private async resolvePermissions(request: SensitiveFieldsRequest): Promise<string[]> {
    if (request.resolvedPermissions) return request.resolvedPermissions;
    if (!request.user?.sub) return [];

    const permissions = await this.fetchPermissionsFromDatabase(request.user.sub);
    request.resolvedPermissions = permissions;
    return permissions;
  }

  private async fetchPermissionsFromDatabase(clerkUserId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: clerkUserId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (!user?.role) return [];

    const allActions = user.role.permissions.map((rp) => rp.permission.action);
    return [...new Set(allActions)];
  }

  private stripSensitiveFields(
    body: unknown,
    fieldPermissions: Record<string, string>,
    userPermissions: string[],
  ): unknown {
    if (!body || typeof body !== 'object') return body;

    const wrapped = body as Record<string, unknown>;

    if ('data' in wrapped && Array.isArray(wrapped.data)) {
      return { ...wrapped, data: this.stripFromList(wrapped.data, fieldPermissions, userPermissions) };
    }

    if ('data' in wrapped && wrapped.data !== null && typeof wrapped.data === 'object') {
      return { ...wrapped, data: this.stripFromObject(wrapped.data, fieldPermissions, userPermissions) };
    }

    return this.stripFromObject(body, fieldPermissions, userPermissions);
  }

  private stripFromList(
    items: unknown[],
    fieldPermissions: Record<string, string>,
    userPermissions: string[],
  ): unknown[] {
    return items.map((item) => this.stripFromObject(item, fieldPermissions, userPermissions));
  }

  private stripFromObject(
    item: unknown,
    fieldPermissions: Record<string, string>,
    userPermissions: string[],
  ): unknown {
    if (!item || typeof item !== 'object') return item;

    const fieldsToRemove = this.resolveFieldsToStrip(fieldPermissions, userPermissions);
    const record = item as Record<string, unknown>;

    return Object.fromEntries(
      Object.entries(record).filter(([key]) => !fieldsToRemove.includes(key)),
    );
  }

  private resolveFieldsToStrip(
    fieldPermissions: Record<string, string>,
    userPermissions: string[],
  ): string[] {
    return Object.entries(fieldPermissions)
      .filter(([, requiredPermission]) => !userPermissions.includes(requiredPermission))
      .map(([fieldName]) => fieldName);
  }
}
