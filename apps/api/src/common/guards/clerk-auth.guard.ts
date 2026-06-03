import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import type { ClerkUser, AuthenticatedRequest } from '../types/clerk.types';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) throw new UnauthorizedException('Missing authorization token');

    request.user = await this.verifyClerkToken(token);
    return true;
  }

  private extractBearerToken(request: AuthenticatedRequest): string | null {
    const authHeader = Array.isArray(request.headers.authorization)
      ? request.headers.authorization[0]
      : request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
  }

  private async verifyClerkToken(token: string): Promise<ClerkUser> {
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
      return payload as ClerkUser;
    } catch (error) {
      if (process.env.STOREFRONT_CLERK_SECRET_KEY) {
        try {
          const payload = await verifyToken(token, {
            secretKey: process.env.STOREFRONT_CLERK_SECRET_KEY,
          });
          return payload as ClerkUser;
        } catch {
          // both failed, fall through to exception
        }
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
