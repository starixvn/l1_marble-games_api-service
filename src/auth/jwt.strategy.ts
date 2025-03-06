import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'MY_SUPER_SECRET_KEY', // same as in JwtModule
      // Optional: ignoreExpiration: false
    });
  }

  async validate(payload: any) {
    // 'validate' is called automatically if token is valid
    // You can do further checks (e.g. user existence in DB) if needed.
    return { userId: payload.sub, username: payload.username };
  }
}
