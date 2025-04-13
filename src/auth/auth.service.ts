import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { v4 as uuidv4 } from 'uuid';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

interface RequestWithUser extends Request {
  user?: {
    id: number;
    [key: string]: any;
  };
}

@Injectable()
export class AuthService {
  // 리프레시 토큰 만료 시간 (7일)
  // private readonly REFRESH_TOKEN_EXPIRES_IN = 60 * 60 * 24 * 7; // 초 단위
  // 액세스 토큰 만료 시간 (1시간)
  // private readonly ACCESS_TOKEN_EXPIRES_IN = '1h';

  private readonly REFRESH_TOKEN_EXPIRES_IN: number;
  private readonly ACCESS_TOKEN_EXPIRES_IN: string;
  private readonly ACCESS_TOKEN_EXPIRES_IN_SECONDS: number;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(User) // 이 부분 추가
    private userRepository: Repository<User>,
  ) {
    this.ACCESS_TOKEN_EXPIRES_IN = this.configService.get(
      'ACCESS_TOKEN_EXPIRES_IN',
      '60m',
    );
    this.ACCESS_TOKEN_EXPIRES_IN_SECONDS = 60 * 60; // 1시간 (초)
    this.REFRESH_TOKEN_EXPIRES_IN = this.configService.get(
      'REFRESH_TOKEN_EXPIRES_IN',
      60 * 60 * 24 * 7,
    ); // 7일 (초)
  }

  async generateToken(userId: number) {
    const payload = { sub: userId };

    // 액세스 토큰은 짧은 유효기간으로 설정
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    });

    // 리프레시 토큰 생성
    const refreshToken = await this.generateRefreshToken(userId);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  // 리프레시 토큰 생성 및 저장 함수
  private async generateRefreshToken(
    userId: number,
    req?: Request,
  ): Promise<string> {
    const refreshToken = uuidv4();

    // 리프레시 토큰 저장
    const refreshTokenEntity = this.refreshTokenRepository.create({
      token: refreshToken,
      userId: userId,
      expires: new Date(Date.now() + this.REFRESH_TOKEN_EXPIRES_IN * 1000),
      userAgent: req?.headers['user-agent'] || null,
      ipAddress: req?.ip || null,
      isActive: true,
    } as RefreshToken);

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return refreshToken;
  }

  // HTTP-only 쿠키로 토큰 설정
  async setTokenCookie(response: Response, userId: number) {
    const tokens = await this.generateToken(userId);

    const secureCookie = this.configService.get('NODE_ENV') === 'production';
    const sameSiteOption =
      this.configService.get('NODE_ENV') === 'production' ? 'strict' : 'lax';

    // 액세스 토큰 쿠키 설정
    const accessExpiration = new Date();
    accessExpiration.setTime(
      accessExpiration.getTime() + this.ACCESS_TOKEN_EXPIRES_IN_SECONDS * 1000,
    ); // 60분

    response.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: sameSiteOption,
      expires: accessExpiration,
      path: '/',
    });

    // 리프레시 토큰 쿠키 설정
    const refreshExpiration = new Date();
    refreshExpiration.setTime(
      refreshExpiration.getTime() + this.REFRESH_TOKEN_EXPIRES_IN * 1000,
    ); // 7일

    response.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: sameSiteOption,
      expires: refreshExpiration,
      path: '/',
    });

    return { userId };
  }

  // 리프레시 토큰으로 새 액세스 토큰 발급
  async refreshAccessToken(refreshToken: string, response: Response) {
    // 리프레시 토큰 검증
    const tokenEntity = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, isActive: true },
    });

    if (!tokenEntity || new Date() > tokenEntity.expires) {
      throw new UnauthorizedException(
        '유효하지 않거나 만료된 리프레시 토큰입니다.',
      );
    }

    // 새 액세스 토큰 생성
    const payload = { sub: tokenEntity.userId };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '60m',
    });

    // 쿠키에 새 액세스 토큰 설정
    const accessExpiration = new Date();
    accessExpiration.setTime(
      accessExpiration.getTime() + this.ACCESS_TOKEN_EXPIRES_IN_SECONDS * 1000,
    ); // 60분
    const sameSiteOption =
      this.configService.get('NODE_ENV') === 'production' ? 'strict' : 'lax';
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') !== 'development',
      sameSite: sameSiteOption,
      expires: accessExpiration,
      path: '/',
    });

    return { success: true, userId: tokenEntity.userId };
  }

  // 소셜 로그인 처리 (Google/Kakao 통합)
  async socialLogin(req: RequestWithUser, res: Response, provider: string) {
    if (!req.user) {
      return res.redirect(
        `${this.configService.get('FRONTEND_URL')}/login?error=${provider}_login_failed`,
      );
    }

    const userId = req.user.id;
    await this.setTokenCookie(res, userId);

    // 프론트엔드로 리디렉션
    return res.redirect(
      `${this.configService.get('FRONTEND_URL')}/auth/${provider}success`,
    );
  }

  // Google 로그인 (socialLogin 호출)
  async googleLogin(req, res: Response) {
    return this.socialLogin(req, res, 'google');
  }

  // 카카오 로그인 (socialLogin 호출)
  async kakaoLogin(req, res: Response) {
    return this.socialLogin(req, res, 'kakao');
  }

  async logout(
    response: Response,
    options?: { userId?: number; refreshToken?: string },
  ) {
    try {
      // 사용자 ID가 제공된 경우: 모든 활성 토큰 비활성화
      if (options?.userId) {
        await this.refreshTokenRepository.update(
          {
            userId: options.userId,
            isActive: true,
          },
          {
            isActive: false,
          },
        );
        console.log(
          `사용자 ID ${options.userId}의 모든 활성 토큰 비활성화 완료`,
        );

        // 마지막 로그인 시간 초기화
        await this.userRepository.update(
          { id: options.userId },
          { lastLoginAt: undefined },
        );
      }
      // 특정 리프레시 토큰만 비활성화
      else if (options?.refreshToken) {
        console.log(
          '리프레시 토큰:',
          options.refreshToken.substring(0, 8) + '...',
        );
        const tokenEntity = await this.refreshTokenRepository.findOne({
          where: { token: options.refreshToken },
        });

        if (tokenEntity) {
          console.log('토큰 찾음:', tokenEntity.id);
          tokenEntity.isActive = false;
          await this.refreshTokenRepository.save(tokenEntity);
          console.log('토큰 비활성화 완료');
        } else {
          console.log('토큰을 찾을 수 없음');
        }
      }

      // 쿠키 삭제 (항상 수행)
      const secureCookie = this.configService.get('NODE_ENV') === 'production';
      const sameSiteOption =
        this.configService.get('NODE_ENV') === 'production' ? 'strict' : 'lax';

      response.clearCookie('access_token', {
        httpOnly: true,
        secure: secureCookie,
        sameSite: sameSiteOption,
        path: '/',
      });

      response.clearCookie('refresh_token', {
        httpOnly: true,
        secure: secureCookie,
        sameSite: sameSiteOption,
        path: '/',
      });

      return {
        statusCode: 200,
        message: '로그아웃 성공',
      };
    } catch (error) {
      console.error('Logout error:', error);
      throw new InternalServerErrorException(
        '로그아웃 중 오류가 발생했습니다.',
      );
    }
  }
}
