import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import type { Request, Response } from 'express';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class AccessLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { user?: { sub?: string } }>();
    const response = http.getResponse<Response>();

    if (!request || !response) {
      return next.handle();
    }

    const finishWithStatus = (statusCode: number) => {
      const responseMs = Date.now() - now;
      void this.prisma.accessLog.create({
        data: {
          userId: request.user?.sub ?? null,
          path: request.originalUrl || request.url,
          method: request.method,
          statusCode,
          ip: request.ip ?? null,
          userAgent: request.headers['user-agent'] ?? null,
          referer: request.headers.referer ?? null,
          responseMs,
          region: 'unknown',
          browser: detectBrowser(request.headers['user-agent']),
          deviceType: detectDeviceType(request.headers['user-agent']),
          isSpider: isSpider(request.headers['user-agent']),
          spiderName: detectSpiderName(request.headers['user-agent']),
        },
      });
    };

    return next.handle().pipe(
      tap(() => {
        finishWithStatus(response.statusCode || 200);
      }),
      catchError((error: unknown) => {
        finishWithStatus(response.statusCode || 500);
        return throwError(() => error);
      }),
    );
  }
}

function normalizeUA(value: string | string[] | undefined) {
  if (!value) return '';
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? '').toLowerCase();
}

function detectBrowser(userAgent: string | string[] | undefined) {
  const ua = normalizeUA(userAgent);
  if (!ua) return 'unknown';
  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('chrome/')) return 'Chrome';
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari';
  if (ua.includes('firefox/')) return 'Firefox';
  if (ua.includes('trident/') || ua.includes('msie')) return 'IE';
  return 'Other';
}

function detectDeviceType(userAgent: string | string[] | undefined) {
  const ua = normalizeUA(userAgent);
  if (!ua) return 'unknown';
  if (ua.includes('mobile')) return 'mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  return 'desktop';
}

function isSpider(userAgent: string | string[] | undefined) {
  const ua = normalizeUA(userAgent);
  if (!ua) return false;
  return /(bot|spider|crawler|slurp|bingpreview|mediapartners-google)/.test(ua);
}

function detectSpiderName(userAgent: string | string[] | undefined) {
  const ua = normalizeUA(userAgent);
  if (!ua) return null;
  if (ua.includes('googlebot')) return 'Googlebot';
  if (ua.includes('bingbot')) return 'Bingbot';
  if (ua.includes('baiduspider')) return 'Baiduspider';
  if (ua.includes('yandexbot')) return 'YandexBot';
  if (ua.includes('duckduckbot')) return 'DuckDuckBot';
  if (ua.includes('sogou')) return 'SogouSpider';
  if (isSpider(ua)) return 'OtherSpider';
  return null;
}
