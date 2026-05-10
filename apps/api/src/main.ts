import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });
  const configService = app.get(ConfigService);
  const globalPrefix = configService.get<string>('app.apiPrefix') ?? 'api/v1';
  const port = configService.get<number>('app.port') ?? 3000;
  const storageUploadDir = configService.get<string>('app.storageUploadDir') || join(process.cwd(), 'uploads');

  if (!existsSync(storageUploadDir)) {
    mkdirSync(storageUploadDir, { recursive: true });
  }
  app.useStaticAssets(storageUploadDir, { prefix: '/static/' });

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
