import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(helmet());

  // CORS configuration
  // app.enableCors({
  //   origin: (origin, cb) => {
  //     if (!origin) cb(null, true);
  //     const allowedOrigins =
  //       configService.get<string>('ALLOWED_ORIGINS')?.split(',') || [];

  //     if (!allowedOrigins.includes(origin)) {
  //       cb(new Error('Not allowed by CORS'), false);
  //     }

  //     cb(null, true);
  //   },
  //   credentials: true,
  // });

  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Mini Auth API')
    .setDescription(
      'Authentication and API Key Management System for Service-to-Service Access',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API Key for service-to-service authentication',
      },
      'api-key',
    )
    .addServer('http://localhost:3000', 'Development')
    .addTag('Auth', 'Authentication endpoints')
    .addTag('API Keys', 'API Key management')
    .addTag('Users', 'User management')
    .addTag('Demo', 'Demo endpoints showing authentication methods')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
  logger.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}

void bootstrap();
