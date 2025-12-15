import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { getPaginationParams, getSkip, createPaginatedResponse } from '../utils/pagination';

export const listAllReviewsByFilter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, minRating, maxRating } = req.query;
    const { page, limit } = getPaginationParams(req.query);

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

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: filters,
        include: { user: true },
        skip: getSkip(page, limit),
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where: filters }),
    ]);

    const paginatedResponse = createPaginatedResponse(reviews, total, page, limit);

    return res
      .status(200)
      .json(new ApiResponse(200, paginatedResponse, 'Filtered reviews retrieved'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to retrieve filtered reviews', [], String(error)));
  }
};

export const addReviewToProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const { productId, rating, comment } = req.body ?? {};
    if (!productId || rating == null) {
      return next(new ApiError(400, 'Product ID and rating are required'));
    }

    // Validate rating bounds
    if (rating < 1 || rating > 5) {
      return next(new ApiError(400, 'Rating must be between 1 and 5'));
    }

    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return next(new ApiError(404, 'Product not found'));
    }

    // Prevent sellers from reviewing their own products
    if (product.sellerId === req.user.id) {
      return next(new ApiError(403, 'You cannot review your own product'));
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

    // Check ownership before deleting
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return next(new ApiError(404, 'Review not found'));
    }

    if (review.userId !== req.user.id && req.user.role !== 'admin') {
      return next(new ApiError(403, 'You can only delete your own reviews'));
    }

    await prisma.review.delete({
      where: { id: reviewId },
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

    // Validate rating bounds
    if (rating < 1 || rating > 5) {
      return next(new ApiError(400, 'Rating must be between 1 and 5'));
    }

    // Check ownership before updating
    const existingReview = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!existingReview) {
      return next(new ApiError(404, 'Review not found'));
    }

    if (existingReview.userId !== req.user.id) {
      return next(new ApiError(403, 'You can only update your own reviews'));
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { rating, comment },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { review }, 'Review updated'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to update review', [], String(error)));
  }
};