import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorMiddleware';
import { apiRateLimiter, authRateLimiter } from './middlewares/rateLimiter';
import { validateRequest } from './middlewares/validation';
import { requireAuth, requireRoles } from './middlewares/authMiddleware';
import * as auth from './controllers/authController';

const app = express();

// -------------------------------------------------------------
// Core Middleware Configurations
// -------------------------------------------------------------

// Secure Headers Protection
app.use(helmet());

// CORS Setup (Credentials enabled for HttpOnly Cookies)
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsers with limits preventing Denial of Service (DoS) body bloating
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Self-contained Custom Cookie Parser Middleware (No external dependency needed)
app.use((req: Request, res: Response, next: NextFunction) => {
  const cookies: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const name = parts.shift()?.trim();
      const value = parts.join('=')?.trim();
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
  }
  req.cookies = cookies;
  next();
});

// Apply Standard Rate Limiter on API routes
app.use('/api/', apiRateLimiter);

// -------------------------------------------------------------
// Authentication Endpoints Routing
// -------------------------------------------------------------

// Account Setup and Verification Flows
app.post('/api/auth/register', validateRequest(auth.registerSchema), auth.register);
app.get('/api/auth/verify-email', validateRequest(auth.verifyEmailSchema), auth.verifyEmail);

// User Authentication Session Flows (Rate-limited)
app.post('/api/auth/login', authRateLimiter, validateRequest(auth.loginSchema), auth.login);
app.post('/api/auth/refresh', auth.refresh);
app.post('/api/auth/logout', auth.logout);

// Password Management Flows (Rate-limited)
app.post('/api/auth/forgot-password', authRateLimiter, validateRequest(auth.forgotPasswordSchema), auth.forgotPassword);
app.post('/api/auth/reset-password', authRateLimiter, validateRequest(auth.resetPasswordSchema), auth.resetPassword);

// Authenticated Password Change
app.post('/api/auth/change-password', requireAuth, validateRequest(auth.changePasswordSchema), auth.changePassword);

// -------------------------------------------------------------
// Protected Demonstration Routes (RBAC Gates)
// -------------------------------------------------------------

/**
 * Standard Authenticated Profile Route
 */
app.get('/api/user/profile', requireAuth, (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Profile retrieved successfully.',
    user: req.user,
  });
});

/**
 * High-Security Admin Route (Enforces ADMIN role context)
 */
app.get('/api/admin/dashboard', requireAuth, requireRoles(['ADMIN']), (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to the Executive Operations Control Room. Authorized Admin access granted.',
    adminId: req.user?.userId,
  });
});

// Centralized Secure Error Handler Middleware
app.use(errorHandler);

export default app;
