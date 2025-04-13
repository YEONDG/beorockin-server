import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Google OAuth 설정에 필요한 환경 변수가 누락되었습니다.');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    // 필수 필드가 없는 경우 기본값 제공
    const email = emails?.[0]?.value || '';
    const firstName = name?.givenName || '';
    const lastName = name?.familyName || '';
    const picture = photos?.[0]?.value || '';

    const userDetails = {
      email,
      firstName,
      lastName,
      picture,
      googleId: profile.id,
      provider: 'google',
    };

    const user = await this.usersService.findOrCreateUserByOAuth(userDetails);
    done(null, user);
  }
}
