import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JwtUser {
  id: string;
  email: string;
  role: 'customer' | 'admin' | 'CUSTOMER' | 'ADMIN';
  authorHandle?: string | null;
}

export const signToken = (user: JwtUser): string =>
  jwt.sign(user, env.JWT_SECRET, { expiresIn: '7d' });

export const verifyToken = (token: string): JwtUser =>
  jwt.verify(token, env.JWT_SECRET) as JwtUser;
