import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConfigKeys } from 'src/config/config-keys';
import { AuthConfig } from 'src/config/types';

interface UserCredParams {
  username: string;
  password?: string;
}

@Injectable()
export class AuthService {

  private readonly auth?: AuthConfig;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService, 
    private readonly jwtService: JwtService,
  ) {
    this.auth = configService.get<AuthConfig>(ConfigKeys.Auth)
  }


  async validateUserCredentials({
    username,
    password
  }: UserCredParams): Promise<string | null> {
    if (!this.auth) return null;

    if (!username || this.auth.username !== username) {
      return null;
    }

    if (!password || this.auth.password !== password) {
      return null;
    }
    return username;
  }

  async generateJwt(user: UserCredParams): Promise<string> {
    const payload = { username: user?.username };
    return this.jwtService.sign(payload, {
      subject: user.username
    });
  }
}
