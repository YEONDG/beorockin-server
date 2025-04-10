import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
}
bootstrap().catch((err) => console.error('서버 시작 실패:', err));
