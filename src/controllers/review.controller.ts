import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.ts';
import { ApiError } from '../utils/ApiError.ts';
import { ApiResponse } from '../utils/ApiResponse.ts';
import { generateAccessToken, generateRefreshToken } from '../utils/auth.ts';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.ts';
import type { Decimal } from '@prisma/client/runtime/client';

export const listAllReviewsByFilter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, minRating, maxRating } = req.query;

    const filters: any = {};
    if (productId) {
      filters.productId = String(productId);
    }
    if (minRating) {
      filters.rating = { ...filters.rating, gte: Number(minRating) };
    }
    if (maxRating) {
      filters.rating = { ...filters.rating, lte: Number(maxRating) };
    }

    const reviews = await prisma.review.findMany({
      where: filters,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { reviews }, 'Filtered reviews retrieved'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to retrieve filtered reviews', [], String(error)));
  }
};

export const addReivewToProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const { productId, rating, comment } = req.body ?? {};
    if (!productId || rating == null) {
      return next(new ApiError(400, 'Product ID and rating are required'));
    }

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        productId,
        rating,
        comment,
      },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { review }, 'Review added to product'));
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, 'Unable to add review', [], String(error)));
  }
};

export const deleteReviewFromProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const { reviewId } = req.body ?? {};
    if (!reviewId) {
      return next(new ApiError(400, 'Review ID is required'));
    }

    await prisma.review.delete({
      where: { id: reviewId, userId: req.user.id },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Review deleted from product'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to delete review', [], String(error)));
  }
};

export const updateReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const { reviewId, rating, comment } = req.body ?? {};
    if (!reviewId || rating == null) {
      return next(new ApiError(400, 'Review ID and rating are required'));
    }

    const review = await prisma.review.update({
      where: { id: reviewId, userId: req.user.id },
      data: { rating, comment },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { review }, 'Review updated'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to update review', [], String(error)));
  }
};