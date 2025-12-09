import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.ts';
import { ApiError } from '../utils/ApiError.ts';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

  if (!token) {
    return next(new ApiError(401, 'Authentication token missing'));
  }

  try {
    const decoded = jwt.verify(token, config.jwtAccessTokenSecret as string) as {
      id: string;
      email: string;
      role: string;
    };
    req.user = decoded;
    return next();
  } catch (err) {
    return next(new ApiError(401, 'Invalid or expired token', [], String(err)));
  }
};


export const adminMiddleware = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== 'admin') {
    return next(new ApiError(403, 'Admin privileges required'));
  }
  return next();
};

