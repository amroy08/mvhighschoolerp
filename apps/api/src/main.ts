import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const clientOrigin = configService.get<string>('CLIENT_ORIGIN', 'http://localhost:3000');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // ─── Security ──────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ─── CORS ──────────────────────────────────────────────────
  app.enableCors({
    origin: clientOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // ─── Cookies ───────────────────────────────────────────────
  app.use(cookieParser());

  // ─── Global Prefix and Versioning ─────────────────────────
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ─── Global Pipes ──────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Global Filters ────────────────────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ─── Global Interceptors ───────────────────────────────────
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ─── Swagger ───────────────────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('MVHS School ERP API')
      .setDescription(
        'Marwari Vidyalaya High School – Student Fee Management and Analytics System API',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('refresh_token')
      .addTag('auth', 'Authentication and session management')
      .addTag('users', 'User management')
      .addTag('roles', 'Role and permission management')
      .addTag('organisations', 'Organisation management')
      .addTag('branches', 'Branch management')
      .addTag('academic-years', 'Academic year management')
      .addTag('financial-years', 'Financial year management')
      .addTag('departments', 'Department/Division management')
      .addTag('grades', 'Grade/Class management')
      .addTag('sections', 'Section management')
      .addTag('fee-heads', 'Fee head management')
      .addTag('students', 'Student management')
      .addTag('health', 'Health check')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  await app.listen(port);
  console.log(`🚀 MVHS ERP API running on http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
