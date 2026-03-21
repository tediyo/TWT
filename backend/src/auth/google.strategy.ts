import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, StrategyOptions } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        configService: ConfigService,
        private usersService: UsersService,
    ) {
        const options: StrategyOptions = {
            clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'missing_client_id',
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'missing_client_secret',
            callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3001/auth/google/callback',
            scope: ['email', 'profile'],
        };
        super(options);
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { id, emails, displayName } = profile;
        const email = emails[0].value;

        const user = await this.usersService.findOrCreateGoogleUser({
            email,
            googleId: id,
            fullName: displayName || email.split('@')[0],
        });

        done(null, user);
    }
}
