import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/auth';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { sanitizeUser } from '../utils/sanitizers';



const generateAccessAndRefreshTokens = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } }) as {
      id: string;
      email: string;
      role: string;
    }
    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role })
    const refreshToken = generateRefreshToken({ id: user.id })

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    })

    return { accessToken, refreshToken }


  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating referesh and access token")
  }
}

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return next(new ApiError(400, 'Email and password are required'));
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new ApiError(409, 'User already exists'));
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash },
    });

    // const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user.id)

    return res
      .status(201)
      .json(new ApiResponse(201, { user: sanitizeUser(user) }, 'User registered'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to register user', [], String(error)));
  }
};



export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return next(new ApiError(400, 'Email and password are required'));
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return next(new ApiError(401, 'Invalid credentials'));
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return next(new ApiError(401, 'Invalid credentials'));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id)

    return res
      .status(200)
      .json(new ApiResponse(200, { user: sanitizeUser(user), accessToken, refreshToken }, 'Logged in successfully'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to login', [], String(error)));
  }
};

export const logoutUser = async (_req: AuthenticatedRequest, res: Response) => {
  const user_id = _req.user?.id;

  if (user_id) {
    await prisma.user.update({
      where: { id: user_id },
      data: { refreshToken: null }
    })
  }

  return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const { oldPassword, newPassword } = req.body ?? {};
    if (!oldPassword || !newPassword) {
      return next(new ApiError(400, 'Old password and new password are required'));
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      return next(new ApiError(401, 'Old password is incorrect'));
    }

    const updatedPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: updatedPasswordHash },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { user: sanitizeUser(user) }, 'Password updated'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to change password', [], String(error)));
  }
};


export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { user: sanitizeUser(user) }, 'User profile fetched'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to fetch user profile', [], String(error)));
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const { name, phoneNumber, bio } = req.body ?? {};

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name, phoneNumber, bio },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { user: sanitizeUser(updatedUser) }, 'Profile updated'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to update profile', [], String(error)));
  }
};

export const regenerateAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) {
      return next(new ApiError(400, 'Refresh token is required'));
    }

    // Verify the refresh token with JWT
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return next(new ApiError(401, 'Invalid or expired refresh token'));
    }

    // Find user by refresh token and verify it matches
    const user = await prisma.user.findFirst({ where: { id: decoded.id, refreshToken } });
    if (!user) {
      return next(new ApiError(401, 'Invalid refresh token'));
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user.id)

    return res
      .status(200)
      .json(new ApiResponse(200, { accessToken, "refreshToken": newRefreshToken }, 'Access token regenerated successfully'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to regenerate access token', [], String(error)));
  }
};


export const sendEmailForVerification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    // Logic to send verification email goes here

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Verification email sent'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to send verification email', [], String(error)));
  }
};

export const verifyEmail = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const { verificationCode } = req.body ?? {};
    if (!verificationCode) {
      return next(new ApiError(400, 'Verification code is required'));
    }

    // Logic to verify the email using the verification code goes here

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Email verified successfully'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to verify email', [], String(error)));
  }
};
