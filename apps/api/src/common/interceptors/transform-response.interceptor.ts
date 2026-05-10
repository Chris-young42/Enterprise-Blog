import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

type ApiSuccessResponse<T> = {
  success: true;
  code: number;
  message: string;
  data: T;
  timestamp: string;
};

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((data: T) => ({
        success: true,
        code: 0,
        message: 'ok',
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
