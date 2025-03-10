import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConfigProps } from 'src/config/consts';

interface UserCredParams {
  username: string;
  password?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService, 
    private readonly jwtService: JwtService,
  ) {}

  async validateUserCredentials({
    username,
    password
  }: UserCredParams): Promise<string | null> {
    const userUsername = await Promise.resolve(this.configService.get<string>(ConfigProps.AUTH_USERNAME));
    if (!userUsername || userUsername !== username) {
      return null;
    }

    const userPassword = await Promise.resolve(this.configService.get(ConfigProps.AUTH_PASSWORD));
    if (!userPassword || userPassword !== password) {
      return null;
    }
    return username;
  }

  async generateJwt(user: UserCredParams): Promise<string> {
    const payload = { username: user?.username };
    return this.jwtService.sign(payload, {
      expiresIn: '24h',
      subject: user.username
    });
  }
}
