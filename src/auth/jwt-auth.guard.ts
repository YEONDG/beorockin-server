import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError } from 'jsonwebtoken';

interface RequestWithCookies extends Request {
  cookies?: {
    [key: string]: string;
  };
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithCookies>();
    const accessToken = request.cookies?.['access_token'];

    console.log('JWT Guard - Access token exists:', !!accessToken);

    // 액세스 토큰이 없는 경우 바로 에러
    if (!accessToken) {
      const refreshToken = request.cookies?.['refresh_token'];

      if (refreshToken) {
        // 액세스 토큰은 없지만 리프레시 토큰이 있는 경우
        throw new UnauthorizedException('액세스 토큰이 만료되었습니다');
      } else {
        // 둘 다 없는 경우
        throw new UnauthorizedException('인증 정보가 없습니다');
      }
    }

    // 액세스 토큰이 있는 경우 기본 검증 과정 진행
    try {
      return (await super.canActivate(context)) as boolean;
    } catch (error: unknown) {
      // 토큰 만료 오류인 경우
      if (
        typeof error === 'object' &&
        error !== null &&
        'cause' in error &&
        error.cause instanceof TokenExpiredError
      ) {
        throw new UnauthorizedException('액세스 토큰이 만료되었습니다');
      }

      // 다른 모든 오류는 그대로 전달
      throw error;
    }
  }

  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    console.log('JWT Guard - Handle request:', {
      error: !!err,
      hasUser: !!user,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      infoType: info ? info.constructor.name : 'none',
    });

    // 토큰 만료 시 UnauthorizedException throw
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException('토큰이 만료되었습니다');
    }

    // 일반적인 인증 에러 처리
    if (err || !user) {
      throw err || new UnauthorizedException('인증에 실패했습니다');
    }

    return user as TUser;
  }
}
