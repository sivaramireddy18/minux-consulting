import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '../utils/db.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/token.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';
import { env } from '../config/env.js';

// -------------------------------------------------------------
// Input Validation Schemas via Zod
// -------------------------------------------------------------
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address.').trim().toLowerCase(),
    name: z.string().min(2, 'Name must be at least 2 characters long.').trim(),
    password: z.string()
      .min(8, 'Password must be at least 8 characters long.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
      .regex(/[0-9]/, 'Password must contain at least one number.')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address.').trim().toLowerCase(),
    password: z.string().min(1, 'Password is required.'),
  }),
});

export const verifyEmailSchema = z.object({
  query: z.object({
    token: z.string().min(10, 'Invalid verification token.'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address.').trim().toLowerCase(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(10, 'Invalid reset token.'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters long.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
      .regex(/[0-9]/, 'Password must contain at least one number.')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, 'Old password is required.'),
    newPassword: z.string()
      .min(8, 'New password must be at least 8 characters long.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
      .regex(/[0-9]/, 'Password must contain at least one number.')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
  }),
});

// Helper: Sets HttpOnly Refresh Token Cookie
const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// -------------------------------------------------------------
// Authentication Controllers
// -------------------------------------------------------------

/**
 * Handles Account Registration Flow
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, name, password } = req.body;

    const existingUser = await db.users.findUnique({ where: { email } });
    if (existingUser) {
      // Return 201 created anyway or a generic message? Zod validator/Security:
      // In high security platforms, return a successful generic message to prevent email harvesting.
      // Alternatively, return a clean validation error:
      res.status(409).json({ error: 'A profile with this email address already exists.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await db.users.create({
      data: {
        email,
        name,
        passwordHash,
        verificationToken,
        verificationExp,
      },
    });

    await sendVerificationEmail(email, name, verificationToken);

    res.status(201).json({
      message: 'Account created successfully. A verification link has been dispatched to your email address.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles Email Token Verification
 */
export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.query.token as string;

    const user = await db.users.findUnique({ where: { verificationToken: token } });

    if (!user || !user.verificationExp || user.verificationExp < new Date()) {
      res.status(400).json({ error: 'The email verification link is invalid or has expired.' });
      return;
    }

    await db.users.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationExp: null,
      },
    });

    res.status(200).json({ message: 'Email address verified successfully. You may now log in.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles User Secure Login Flow (Generic Credential Error Checking)
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    // Secure Generic Error Response to prevent email enumeration
    const genericAuthError = () => {
      res.status(401).json({ error: 'Invalid email address or password configuration.' });
    };

    const user = await db.users.findUnique({ where: { email } });
    if (!user) {
      // Fake delay to prevent timing attacks detecting missing emails
      await new Promise(resolve => setTimeout(resolve, 300));
      genericAuthError();
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      genericAuthError();
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({ error: 'Your account email address has not been verified.' });
      return;
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Save session in DB for session tracking and rotation checks
    await db.sessions.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      },
    });

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Session Token Rotation and Access Token Refresh Flow
 */
export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(401).json({ error: 'Authentication failed. Missing session refresh token.' });
      return;
    }

    // Verify refresh token signature
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (e) {
      res.status(401).json({ error: 'Authentication failed. Invalid or expired refresh token.' });
      return;
    }

    // Query session in DB
    const session = await db.sessions.findUnique({ where: { refreshToken } });
    if (!session || session.expiresAt < new Date()) {
      // If session not found, but token is valid, it could be a token theft/replay attack.
      // Erase all sessions of user for safety!
      if (session) {
        await db.sessions.delete({ where: { refreshToken } });
      }
      res.status(401).json({ error: 'Session expired or invalidated.' });
      return;
    }

    // Rotate tokens (Refresh Token Rotation!)
    const userPayload = { userId: session.user.id, email: session.user.email, role: session.user.role };
    const newAccessToken = signAccessToken(userPayload);
    const newRefreshToken = signRefreshToken(userPayload);

    // Delete old session and write new rotated session record
    await db.sessions.delete({ where: { refreshToken } });
    await db.sessions.create({
      data: {
        userId: session.user.id,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      },
    });

    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles Account Logout Flow
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Remove session from database
      await db.sessions.delete({ where: { refreshToken } });
    }

    // Clear client-side cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
    });

    res.status(200).json({ message: 'Session logged out successfully.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles Password Forget request (Dispatches verification code)
 */
export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    
    // Always return a success message to prevent email harvesting!
    const successResponse = () => {
      res.status(200).json({ message: 'If this email is registered, a password reset link has been dispatched.' });
    };

    const user = await db.users.findUnique({ where: { email } });
    if (!user) {
      // Fake delay
      await new Promise(resolve => setTimeout(resolve, 200));
      successResponse();
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.users.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExp: resetExp,
      },
    });

    await sendPasswordResetEmail(email, user.name, resetToken);

    successResponse();
  } catch (error) {
    next(error);
  }
}

/**
 * Resets user password utilizing active password reset token
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = req.body;

    const user = await db.users.findUnique({ where: { passwordResetToken: token } });

    if (!user || !user.passwordResetExp || user.passwordResetExp < new Date()) {
      res.status(400).json({ error: 'This password reset link is invalid or has expired.' });
      return;
    }

    const passwordHash = await hashPassword(password);

    await db.users.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExp: null,
      },
    });

    res.status(200).json({ message: 'Your password has been successfully updated. You may now log in.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Changes User Password inside active session
 */
export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { oldPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const user = await db.users.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    const isMatch = await comparePassword(oldPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'The old password you entered is incorrect.' });
      return;
    }

    const passwordHash = await hashPassword(newPassword);

    await db.users.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.status(200).json({ message: 'Your password has been successfully updated.' });
  } catch (error) {
    next(error);
  }
}
