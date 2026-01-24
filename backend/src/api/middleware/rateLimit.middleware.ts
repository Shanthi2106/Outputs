import { Request, Response, NextFunction } from 'express';
import config from '../../config';
import { logger } from '../../utils/logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiting middleware
 * For production, use Redis or a proper rate limiting service
 */
export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Disable rate limiting in development mode for easier testing
  if (config.nodeEnv === 'development') {
    next();
    return;
  }

  const clientId = req.ip || 'unknown';
  const now = Date.now();

  // Clean up expired entries
  if (Math.random() < 0.1) {
    // 10% chance to clean up
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    });
  }

  // Get or create client entry
  if (!store[clientId]) {
    store[clientId] = {
      count: 0,
      resetTime: now + config.rateLimitWindowMs,
    };
  }

  const clientData = store[clientId];

  // Reset if window has passed
  if (clientData.resetTime < now) {
    clientData.count = 0;
    clientData.resetTime = now + config.rateLimitWindowMs;
  }

  // Increment count
  clientData.count += 1;

  // Check if limit exceeded
  if (clientData.count > config.rateLimitMaxRequests) {
    const resetIn = Math.ceil((clientData.resetTime - now) / 1000);

    logger.warn('Rate limit exceeded:', {
      ip: clientId,
      count: clientData.count,
      resetIn,
    });

    res.status(429).json({
      error: 'Too many requests',
      message: `You have exceeded the rate limit. Please try again in ${resetIn} seconds.`,
      retryAfter: resetIn,
    });
    return;
  }

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', config.rateLimitMaxRequests);
  res.setHeader('X-RateLimit-Remaining', config.rateLimitMaxRequests - clientData.count);
  res.setHeader(
    'X-RateLimit-Reset',
    new Date(clientData.resetTime).toISOString()
  );

  next();
}

export default rateLimitMiddleware;
