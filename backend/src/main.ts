import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  // Winston logger configuration
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, trace }) => {
            return `${timestamp} [${context}] ${level}: ${message}${trace ? `\n${trace}` : ''}`;
          }),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  const apiVersion = configService.get<string>('API_VERSION', 'v1');
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  const corsOrigins = configService.get<string>('CORS_ORIGIN', 'http://localhost:3001');
  app.enableCors({
    origin: corsOrigins.split(',').map(origin => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      configService.get<string>('TENANT_HEADER_NAME', 'X-Tenant-ID')
    ],
  });

  // Swagger documentation
  if (configService.get<boolean>('SWAGGER_ENABLED', true)) {
    const config = new DocumentBuilder()
      .setTitle(configService.get<string>('SWAGGER_TITLE', 'ProcureERP API'))
      .setDescription(configService.get<string>('SWAGGER_DESCRIPTION', 'Enterprise Procurement Management System API'))
      .setVersion(configService.get<string>('SWAGGER_VERSION', '1.0'))
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter Auth0 access token',
        in: 'header',
      })
      .addApiKey({
        type: 'apiKey',
        name: configService.get<string>('TENANT_HEADER_NAME', 'X-Tenant-ID'),
        in: 'header',
        description: 'Tenant identifier',
      })
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const swaggerPath = configService.get<string>('SWAGGER_PATH', 'api-docs');
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // Basic health check endpoint for load balancers (Liveness Probe)
  // 最小限の情報でアプリケーションの生存確認
  app.use('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}/${apiVersion}`);
  logger.log(`📚 API Documentation available at: http://localhost:${port}/${configService.get<string>('SWAGGER_PATH', 'api-docs')}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
