import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { EnhancedValidationPipe } from './shared-kernel/pipes/enhanced-validation.pipe';
import { SanitizerService } from './shared-kernel/services/sanitizer.service';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { Request, Response } from 'express';
import helmet from 'helmet';
import { CspService } from './infrastructure/security/csp.service';
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
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
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

  // Enterprise-grade Content Security Policy (CSP) with Helmet
  const cspService = app.get(CspService);
  
  // Configure Helmet with comprehensive security headers
  app.use(helmet({
    // Disable default CSP - we use our custom CSP service
    contentSecurityPolicy: false,
    
    // Enable other security headers
    crossOriginEmbedderPolicy: { policy: 'require-corp' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    
    // DNS Prefetch Control
    dnsPrefetchControl: { allow: false },
    
    // Frameguard
    frameguard: { action: 'deny' },
    
    // Hide Powered-By header
    hidePoweredBy: true,
    
    // HSTS - configured dynamically based on environment
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    
    // IE No Open
    ieNoOpen: true,
    
    // Don't Sniff Mimetype
    noSniff: true,
    
    // Origin Agent Cluster
    originAgentCluster: true,
    
    // Permissions Policy
    permittedCrossDomainPolicies: false,
    
    // Referrer Policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    
    // XSS Filter
    xssFilter: true,
  }));
  
  // Apply custom CSP headers using our CspService
  app.use((req: Request, res: Response, next: Function) => {
    try {
      const nonce = cspService.applyCspHeaders(req, res);
      
      // Make nonce available to the request for SSR usage
      (req as any).cspNonce = nonce;
      
      next();
    } catch (error) {
      logger.error('CSP header application failed', error, 'Bootstrap');
      next();
    }
  });
  
  logger.log('🛡️ Enterprise-grade Helmet + CSP security headers activated', 'Bootstrap');
  
  // Enhanced Global Validation with Sanitization
  const sanitizerService = app.get(SanitizerService);
  app.useGlobalPipes(
    new EnhancedValidationPipe(sanitizerService),
  );
  
  logger.log('🔐 Enhanced Validation Pipeline activated with XSS/SQL protection', 'Bootstrap');

  // CORS - Enhanced with CSP nonce header support
  const corsOrigins = configService.get<string>('CORS_ORIGIN', 'http://localhost:3001');
  app.enableCors({
    origin: corsOrigins.split(',').map((origin) => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      configService.get<string>('TENANT_HEADER_NAME', 'X-Tenant-ID'),
      'X-CSP-Nonce', // Allow CSP nonce header
      'X-CSRF-Token', // Allow CSRF token header
    ],
    exposedHeaders: [
      'X-CSP-Nonce', // Expose CSP nonce to frontend
      'X-CSRF-Token', // Expose CSRF token to frontend
    ],
  });

  // Swagger documentation
  if (configService.get<boolean>('SWAGGER_ENABLED', true)) {
    const config = new DocumentBuilder()
      .setTitle(configService.get<string>('SWAGGER_TITLE', 'ProcureERP API'))
      .setDescription(
        configService.get<string>(
          'SWAGGER_DESCRIPTION',
          'Enterprise Procurement Management System API',
        ),
      )
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
  logger.log(
    `📚 API Documentation available at: http://localhost:${port}/${configService.get<string>('SWAGGER_PATH', 'api-docs')}`,
  );
  
  // Log CSP configuration status
  const cspStats = cspService.getCspStatistics();
  logger.log(
    `🛡️ CSP Security: ${cspStats.enabled ? 'ENABLED' : 'DISABLED'} | ` +
    `Mode: ${cspStats.reportOnly ? 'REPORT-ONLY' : 'ENFORCE'} | ` +
    `HTTPS: ${cspStats.enforceHttps ? 'ENFORCED' : 'OPTIONAL'} | ` +
    `Allowed Domains: ${cspStats.allowedDomainsCount}`,
    'Bootstrap'
  );
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
