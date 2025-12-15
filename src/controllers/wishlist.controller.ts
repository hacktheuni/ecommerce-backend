import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const getMyWishlistProducts = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      include: { product: true },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { items: wishlistItems }, 'Wishlist items retrieved'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to retrieve wishlist items', [], String(error)));
  }
};

export const addProductToWishlist = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const { productId } = req.body ?? {};
    if (!productId) {
      return next(new ApiError(400, 'Product ID is required'));
    }

    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return next(new ApiError(404, 'Product not found'));
    }

    const existingItem = await prisma.wishlistItem.findFirst({
      where: { userId: req.user.id, productId },
    });

    if (existingItem) {
      return next(new ApiError(400, 'Product already in wishlist'));
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: { userId: req.user.id, productId },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { item: wishlistItem }, 'Product added to wishlist'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to add product to wishlist', [], String(error)));
  }
};

export const removeProductFromWishlist = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const { productId } = req.body ?? {};
    if (!productId) {
      return next(new ApiError(400, 'Product ID is required'));
    }

    const existingItem = await prisma.wishlistItem.findFirst({
      where: { userId: req.user.id, productId },
    });

    if (!existingItem) {
      return next(new ApiError(404, 'Product not found in wishlist'));
    }

    await prisma.wishlistItem.delete({
      where: { id: existingItem.id },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Product removed from wishlist'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to remove product from wishlist', [], String(error)));
  }
};