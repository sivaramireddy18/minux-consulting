import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/token.js';

// Extend Express Request declaration to include user context
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * JWT Verification Gatekeeper.
 * Validates Bearer authorization headers and binds verified payloads to req.user.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access denied. Missing or malformed authentication token.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Session expired. Access token has expired.' });
      return;
    }
    res.status(401).json({ error: 'Access denied. Invalid or corrupted authentication token.' });
  }
};

/**
 * Role-Based Access Control (RBAC) Guard.
 * Restricts access to users belonging to specified role groups.
 */
export const requireRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Access denied. Authentication context missing.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access denied. Insufficient permissions to access this resource.' });
      return;
    }

    next();
  };
};
