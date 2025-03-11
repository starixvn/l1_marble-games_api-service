import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConfigKeys } from 'src/config/config-keys';
import { OperatorService } from 'src/operator/operator.service';
import bcrypt from 'bcryptjs';

interface OperatorCredParams {
  operatorId: string;
  password?: string;
}

@Injectable()
export class AuthService {
  private readonly expireIn: string;

  constructor(
    @Inject(ConfigService) configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(OperatorService)
    private readonly operatorService: OperatorService,
  ) {
    this.expireIn = configService.get(ConfigKeys.Jwt).signOptions.expireIn;
  }

  async validateOperatorCredential({
    operatorId,
    password,
  }: OperatorCredParams): Promise<string | null> {
    if (!password) return null;

    const operator = await this.operatorService.getOperator(operatorId);

    if (!operator) return null;

    const isPasswordMatch = await bcrypt.compare(password, operator.password);

    return isPasswordMatch ? operator._id.toString() : null;
  }

  async generateJwt(user: OperatorCredParams): Promise<string> {
    const payload = { username: user?.operatorId };
    return this.jwtService.sign(payload, {
      subject: user.operatorId,
      expiresIn: this.expireIn,
    });
  }
}
