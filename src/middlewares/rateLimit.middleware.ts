import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

export const rateLimit = (options: {
    windowMs: number;
    max: number;
    message?: string;
    keyGenerator?: (req: Request) => string;
}) => {
    const { windowMs, max, message = 'Too many requests, please try again later', keyGenerator } = options;

    return (req: Request, _res: Response, next: NextFunction) => {
        const key = keyGenerator ? keyGenerator(req) : req.ip || 'unknown';
        const now = Date.now();

        if (!store[key] || store[key].resetTime < now) {
            store[key] = {
                count: 1,
                resetTime: now + windowMs,
            };
            return next();
        }

        if (store[key].count >= max) {
            return next(new ApiError(429, message));
        }

        store[key].count++;
        return next();
    };
};

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
        if (store[key]!.resetTime < now) {
            delete store[key];
        }
    });
}, 60000); // Clean up every minute
