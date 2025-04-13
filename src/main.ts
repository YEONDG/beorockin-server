import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: ['http://localhost:3000', 'https://your-frontend-domain.com'], // 프론트엔드 도메인
    credentials: true, // 쿠키 포함 요청 허용 (withCredentials: true 대응)
  });

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('API 문서')
    .setDescription('NestJS API 라우트 목록')
    .setVersion('1.0')
    .addTag('users', '사용자 관리 API')
    .addTag('auth', '인증 관련 API')
    .addBearerAuth(
      // 인증 방식 추가
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'Cookie',
      name: 'access_token',
    })
    .setContact('개발자', 'https://github.com/YEONDG', 'zzmn1234@naver.com')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
}
bootstrap().catch((err) => console.error('서버 시작 실패:', err));
