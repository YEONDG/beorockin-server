import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

// JWT 페이로드 타입 정의
export interface JwtPayload {
  sub: string;
  username: string;
  iat?: number;
  exp?: number;
}

interface UserData {
  userId: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secretKey = configService.get<string>('JWT_SECRET');

    if (!secretKey) {
      throw new Error('JWT_SECRET 환경 변수가 누락되었습니다.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const cookies = request.cookies as Record<string, string>;
          console.log('Request cookies:', cookies);

          const token: string | undefined = cookies?.['access_token'];
          console.log('Access token from cookie:', token);

          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secretKey,
    });
  }

  validate(payload: JwtPayload) {
    console.log(payload, '페이로드확인');
    if (!payload.sub) {
      throw new Error('JWT 페이로드에 필요한 정보가 누락되었습니다.');
    }
    const userData: UserData = {
      userId: payload.sub,
      username: payload.username || '',
    };

    return userData;
  }
}
