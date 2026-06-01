import rateLimit from 'express-rate-limit';

/**
 * High-security rate limiter for sensitive authentication endpoints.
 * Blocks brute force and credential stuffing attacks by capping IPs to 5 attempts per 15 minutes.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true, // Return standard rate limit info headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  statusCode: 429,
});

/**
 * Standard API rate limiter for general routes.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per minute
  message: {
    error: 'Rate limit exceeded. Please throttle your API requests.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
