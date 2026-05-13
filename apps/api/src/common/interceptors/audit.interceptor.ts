import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { AuditCategory } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AUDIT_KEY, type AuditMetadata } from '../decorators/audit.decorator';
import type { AuthenticatedRequest } from '../types/clerk.types';

const METHOD_TO_ACTION: Record<string, string> = {
  POST: 'CREATE',
  PATCH: 'UPDATE',
  PUT: 'UPDATE',
  DELETE: 'DELETE',
};

type AuditRequest = AuthenticatedRequest & {
  method: string;
  body: unknown;
  params: Record<string, string>;
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditMetadata = this.reflector.getAllAndOverride<AuditMetadata>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!auditMetadata) return next.handle();

    const request = context.switchToHttp().getRequest<AuditRequest>();
    const action = METHOD_TO_ACTION[request.method];

    if (!action) return next.handle();

    return next.handle().pipe(
      tap(async (responseBody) => {
        try {
          await this.createAuditLog(request, responseBody, auditMetadata, action);
        } catch (error) {
          console.error('[AuditInterceptor] Failed to create audit log:', error);
        }
      }),
    );
  }

  private async createAuditLog(
    request: AuditRequest,
    responseBody: unknown,
    metadata: AuditMetadata,
    action: string,
  ): Promise<void> {
    const actorId = request.user?.sub;
    if (!actorId) return;

    await this.prisma.auditLog.create({
      data: {
        actorId,
        entityType: metadata.entityType,
        entityId: this.extractEntityId(responseBody, request.params),
        action,
        category: metadata.category as AuditCategory,
        diff: action !== 'DELETE' ? (request.body as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  private extractEntityId(
    responseBody: unknown,
    params: Record<string, string>,
  ): string | null {
    if (responseBody && typeof responseBody === 'object') {
      const id = (responseBody as Record<string, unknown>).id;
      if (typeof id === 'string') return id;
    }

    return params?.id ?? null;
  }
}
