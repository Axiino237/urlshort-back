import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for high-end React client requests
  app.enableCors({
    origin: '*', // In production, customize this to your Vercel URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Strict Global Validations
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Axiino API Engine spinning on: http://localhost:${port}`);
}
bootstrap();
