import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { QuizModule } from './quiz/quiz.module';
import { UserStatsModule } from './user-stats/user-stats.module';

@Module({
  imports: [
    // 환경 변수 로드
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // TypeORM 설정
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'nest_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'], // 엔티티 자동 로드
        synchronize: configService.get<boolean>('DB_SYNC', false), // 개발 시에만 true 권장
        autoLoadEntities: true,
        logging: configService.get<boolean>('DB_LOGGING', false),
        charset: 'utf8mb4',
        timezone: '+09:00', // 한국 시간대
      }),
    }),

    UsersModule,
    AuthModule,
    QuizModule,
    UserStatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
