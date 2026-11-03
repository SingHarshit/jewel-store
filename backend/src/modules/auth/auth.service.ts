import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { signToken } from '../../utils/jwt.js';

export const authService = {
  async register(input: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    authorHandle?: string;
  }) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input.email },
          ...(input.authorHandle ? [{ authorHandle: input.authorHandle }] : [])
        ]
      }
    });

    if (existing) {
      if (existing.email.toLowerCase() === input.email.toLowerCase()) {
        throw new ApiError(409, 'A user with this email already exists');
      }
      throw new ApiError(409, 'This author handle is already taken');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const handle =
      input.authorHandle ||
      `@${(input.firstName || 'user').toLowerCase()}${Math.floor(100 + Math.random() * 900)}`;

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        authorHandle: handle.startsWith('@') ? handle : `@${handle}`,
        role: Role.CUSTOMER,
        membershipTier: 'Private Client',
        sizingKitVoucherCode: `HEIREST-KIT-${Math.floor(10 + Math.random() * 90)}`
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        authorHandle: true,
        role: true,
        membershipTier: true,
        sizingKitVoucherCode: true,
        createdAt: true
      }
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      role: 'customer',
      authorHandle: user.authorHandle
    });

    return { user: { ...user, role: 'customer' }, token };
  },

  async login(input: { email: string; password?: string; otpCode?: string }) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() }
    });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (input.password) {
      if (!user.passwordHash) {
        throw new ApiError(401, 'Invalid email or password');
      }
      const match = await bcrypt.compare(input.password, user.passwordHash);
      if (!match) {
        throw new ApiError(401, 'Invalid email or password');
      }
    } else if (input.otpCode) {
      if (input.otpCode !== '123456' && input.otpCode.length < 4) {
        throw new ApiError(401, 'Invalid verification code');
      }
    } else {
      throw new ApiError(400, 'Password or OTP code required');
    }

    const roleLower = user.role.toLowerCase() as 'customer' | 'admin';
    const token = signToken({
      id: user.id,
      email: user.email,
      role: roleLower,
      authorHandle: user.authorHandle
    });

    const { passwordHash: _, ...safeUser } = user;
    return { user: { ...safeUser, role: roleLower }, token };
  },

  async requestMagicLink(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    // If user does not exist, we still respond sent: true to simulate OTP delivery
    return { sent: true, email, exists: !!user };
  },

  async verifyOtp(email: string, otpCode: string) {
    if (otpCode.length < 4) {
      throw new ApiError(400, 'Invalid OTP code');
    }

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      const handle = `@${email.split('@')[0]}`;
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          firstName: email.split('@')[0],
          authorHandle: handle,
          role: Role.CUSTOMER,
          membershipTier: 'Private Client',
          sizingKitVoucherCode: `HEIREST-KIT-${Math.floor(10 + Math.random() * 90)}`
        }
      });
    }

    const roleLower = user.role.toLowerCase() as 'customer' | 'admin';
    const token = signToken({
      id: user.id,
      email: user.email,
      role: roleLower,
      authorHandle: user.authorHandle
    });

    const { passwordHash: _, ...safeUser } = user;
    return { user: { ...safeUser, role: roleLower }, token };
  },

  async loginAsDemo(role: 'customer' | 'admin') {
    const email = role === 'admin' ? 'admin@heirest.com' : 'india@heirest.co';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new ApiError(404, `Demo ${role} user not found`);
    }

    const roleLower = user.role.toLowerCase() as 'customer' | 'admin';
    const token = signToken({
      id: user.id,
      email: user.email,
      role: roleLower,
      authorHandle: user.authorHandle
    });

    const { passwordHash: _, ...safeUser } = user;
    return { user: { ...safeUser, role: roleLower }, token };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        authorHandle: true,
        avatarUrl: true,
        membershipTier: true,
        role: true,
        sizingKitVoucherCode: true,
        sizingKitRedeemed: true,
        savedSizes: true,
        preferredChainLengths: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            designs: true,
            orders: true,
            vaultItems: true
          }
        }
      }
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return { ...user, role: user.role.toLowerCase() as 'customer' | 'admin' };
  }
};
