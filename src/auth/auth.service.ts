import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConfigKeys } from '../config/config-keys';
import { OperatorService } from '../operator/operator.service';
import { compare } from 'bcryptjs';
import { ObjectId } from 'mongoose';

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

    const isPasswordMatch = await compare(password, operator.password);

    return isPasswordMatch ? (operator._id as ObjectId).toString() : null;
  }

  async generateJwt(user: OperatorCredParams): Promise<string> {
    const payload = { username: user?.operatorId };
    return await this.jwtService.signAsync(payload, {
      subject: user.operatorId,
      expiresIn: this.expireIn,
    });
  }
}
