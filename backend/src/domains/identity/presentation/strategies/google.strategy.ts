import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@/config/config.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.googleClientId,
      clientSecret: configService.googleClientSecret,
      callbackURL: configService.googleCallbackUrl,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: unknown,
    accessToken: string,
    refreshToken: string,
    profile: {
      id: string;
      emails?: { value: string; verified?: boolean }[];
      name?: { givenName?: string; familyName?: string };
      displayName?: string;
      photos?: { value: string }[];
    },
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new UnauthorizedException('Google account has no email');
    }

    if (!profile.emails?.[0]?.verified) {
      throw new UnauthorizedException('Google email is not verified');
    }

    return {
      email,
      name: profile.displayName || profile.name?.givenName || '',
      profilePicture: profile.photos?.[0]?.value || null,
      provider: 'GOOGLE',
      providerId: profile.id,
    };
  }
}
