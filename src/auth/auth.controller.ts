import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request as RequestDecorator,
  Res,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  async register(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.usersService.register(createUserDto);
    await this.authService.setTokenCookie(response, user.id);
    console.log(user, '유저뭐예요');

    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  }

  @Post('login')
  @ApiOperation({ summary: '로그인' })
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.usersService.validateUser(
      loginUserDto.email,
      loginUserDto.password,
    );

    await this.authService.setTokenCookie(response, user.id);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: '로그아웃' })
  async logout(
    @Res({ passthrough: true }) response: Response,
    @Req() req: Request,
  ) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;

    if (!refreshToken) {
      // 쿠키만 삭제
      response.clearCookie('access_token', {
        httpOnly: true,
        path: '/',
      });
      response.clearCookie('refresh_token', {
        httpOnly: true,
        path: '/',
      });
      return { success: true, message: '로그아웃 완료' };
    }

    return this.authService.logout(response, { refreshToken });
  }

  @Post('refresh')
  @ApiOperation({ summary: '액세스 토큰 갱신' })
  @ApiCookieAuth('refresh_token')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException('리프레시 토큰이 없습니다');
    }

    return this.authService.refreshAccessToken(refreshToken, response);
  }

  // 구글 로그인 시작
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // 이 함수는 구글 인증 페이지로 리디렉션하는 용도로만 사용
    // 실제 구현 내용은 필요 없음
  }

  // 구글 로그인 콜백
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthCallback(@Req() req, @Res() res: Response) {
    return this.authService.googleLogin(req, res);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '내 프로필 조회' })
  async getProfile(@RequestDecorator() req: { user: { userId: number } }) {
    const userId = req.user.userId;

    console.log(userId, '이거 너냐?');
    // UserService를 통해 전체 사용자 정보 조회
    const fullUserProfile = await this.usersService.findOne(userId);

    return fullUserProfile;
  }

  // 카카오 로그인 시작
  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  kakaoAuth() {}

  // 카카오 로그인 콜백
  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  kakaoAuthCallback(@Req() req, @Res() res: Response) {
    return this.authService.kakaoLogin(req, res);
  }
}
