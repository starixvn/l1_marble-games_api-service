import { Controller, Body, UnauthorizedException, HttpCode, HttpStatus, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login with username and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: "string"
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Invalid credentials',

  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: AuthDto): Promise<string> {
    const user = await this.authService.validateUserCredentials({
      username: loginDto.username,
      password: loginDto.password,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.authService.generateJwt({
      username: loginDto.username
    });

    return token;
  }
}
