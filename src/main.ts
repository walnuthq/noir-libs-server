import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from "express-session";
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable CORS
  app.enableCors({
    origin: '*', // Allow the frontend domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Enable if you need to send cookies or authentication data
  });
    app.useGlobalPipes(new ValidationPipe({
        forbidNonWhitelisted: true,  // block requests with unknown properties
        transform: true,
    }));
  app.use(
      session({
        secret: "mysecret",
        resave: false,
        saveUninitialized: false,
      })
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
