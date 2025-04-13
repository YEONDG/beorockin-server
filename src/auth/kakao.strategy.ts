import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

interface KakaoProfile {
  id: string;
  _json: {
    kakao_account: {
      email?: string;
      profile?: {
        nickname?: string;
        profile_image_url?: string;
      };
    };
  };
}

type DoneCallback = (error: Error | null, user?: any) => void;

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private configService: ConfigService,
    private userService: UsersService,
  ) {
    const clientID = configService.get<string>('KAKAO_CLIENT_ID');
    const clientSecret = configService.get<string>('KAKAO_CLIENT_SECRET');
    const callbackURL = configService.get<string>('KAKAO_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('kakao OAuth 설정에 필요한 환경 변수가 누락되었습니다.');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: KakaoProfile,
    done: DoneCallback,
  ) {
    const { _json } = profile;
    const kakao_account = _json.kakao_account || {};
    const profileData = kakao_account.profile || {};

    const userDetails = {
      email: kakao_account.email || `${profile.id}@kakao.com`,
      firstName: profileData.nickname || '',
      lastName: '',
      picture: profileData.profile_image_url || '',
      kakaoId: profile.id,
      provider: 'kakao',
    };
    const user = await this.userService.findOrCreateUserByOAuth(userDetails);

    done(null, user);
  }
}
