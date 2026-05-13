import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs';

interface ApiResponse<T> {
  data: T;
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T> | T> {
    return next.handle().pipe(map((data) => this.wrapResponse(data)));
  }

  private wrapResponse(data: T): ApiResponse<T> | T {
    if (this.isAlreadyWrapped(data)) return data;
    return { data };
  }

  private isAlreadyWrapped(data: unknown): boolean {
    return data !== null && typeof data === 'object' && 'data' in (data as object);
  }
}
