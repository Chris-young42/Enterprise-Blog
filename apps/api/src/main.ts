import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { AccessLogInterceptor } from './common/interceptors/access-log.interceptor';
import { PrismaService } from './modules/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const globalPrefix = configService.get<string>('app.apiPrefix') ?? 'api/v1';
  const port = configService.get<number>('app.port') ?? 3000;
  const corsOriginsRaw = configService.get<string>('app.corsOrigins') ?? '';
  const corsOrigins = corsOriginsRaw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  const storageUploadDir = configService.get<string>('app.storageUploadDir') || join(process.cwd(), 'uploads');
  const enforceHttps = (configService.get<string>('app.enforceHttps') ?? 'false') === 'true';

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });

  if (!existsSync(storageUploadDir)) {
    mkdirSync(storageUploadDir, { recursive: true });
  }
  app.useStaticAssets(storageUploadDir, { prefix: '/static/' });
  app.set('trust proxy', true);
  app.use((req: Request, res: Response, next: NextFunction) => {
    const forwardedProtoRaw = req.headers['x-forwarded-proto'];
    const forwardedProto = Array.isArray(forwardedProtoRaw)
      ? forwardedProtoRaw[0]
      : forwardedProtoRaw;
    const isHttps = req.secure || forwardedProto === 'https';

    if (isHttps) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    if (enforceHttps && !isHttps) {
      res.status(426).json({
        success: false,
        code: 426,
        message: 'HTTPS is required',
        path: req.url,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next();
  });

  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new TransformResponseInterceptor());
  app.useGlobalInterceptors(new AccessLogInterceptor(app.get(PrismaService)));
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Enterprise Blog API')
    .setDescription('Enterprise Blog RESTful API documentation')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Enterprise Blog API Docs',
  });

  await app.listen(port);
}

bootstrap();
