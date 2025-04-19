import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';
import { KakaoStrategy } from './kakao.strategy';
import { User } from 'src/users/entities/user.entity';
import { UserStatsModule } from 'src/user-stats/user-stats.module';

@Module({
  imports: [
    UsersModule,
    UserStatsModule,
    PassportModule,
    TypeOrmModule.forFeature([RefreshToken, User]), // RefreshToken, User 엔티티 등록
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '60m' }, // 액세스 토큰 만료 시간을 60분으로 수정
      }),
    }),
  ],
  controllers: [AuthController], // AuthController 등록
  providers: [AuthService, JwtStrategy, GoogleStrategy, KakaoStrategy],
  exports: [AuthService],
})
export class AuthModule {}
