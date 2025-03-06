import { Schema, Document } from 'mongoose';

export const UserSchema = new Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

// For NestJS usage
export interface User extends Document {
  username: string;
  password: string;
}
