import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.schema'; // interface from user.schema.ts

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUserCredentials(
    username: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      return null;
    }

    // In production, compare hashed passwords (e.g., bcrypt.compare)
    if (user.password === password) {
      return user;
    }
    return null;
  }

  // Generate JWT for a specific user
  async generateJwt(user: User): Promise<string> {
    const payload = { username: user.username, sub: user._id };
    return this.jwtService.sign(payload, {
      expiresIn: '24h'
    });
  }

  // Optional: sign up a new user
  async createUser(username: string, password: string): Promise<User> {
    const newUser = new this.userModel({ username, password });
    return newUser.save();
  }
}
