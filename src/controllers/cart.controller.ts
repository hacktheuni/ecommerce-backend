import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.ts';
import { ApiError } from '../utils/ApiError.ts';
import { ApiResponse } from '../utils/ApiResponse.ts';
import { generateAccessToken, generateRefreshToken } from '../utils/auth.ts';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.ts';
import type { Decimal } from '@prisma/client/runtime/client';

const sanitizedCartItem = (item: { id: string; productId: string; quantity: number; product: { id: string; name: string; description: string | null; price: Decimal; } }) => ({
  id: item.id,
  productId: item.productId,
  quantity: item.quantity,
  product: {
    id: item.product.id,
    name: item.product.name,
    description: item.product.description,
    price: item.product.price
  },
});

export const listItemsAndTotal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true },
    });

    const sanitizedItems = cartItems.map(sanitizedCartItem);
    const totalPrice = sanitizedItems.reduce((total, item) => total + (item.product.price.toNumber() * item.quantity), 0);

    return res
      .status(200)
      .json(new ApiResponse(200, { items: sanitizedItems, totalPrice }, 'Cart items retrieved'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to retrieve cart items', [], String(error)));
  }
};

export const addItemToCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const { productId, quantity } = req.body ?? {};
    if (!productId || !quantity || quantity <= 0) {
      return next(new ApiError(400, 'Product ID and valid quantity are required'));
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: { userId: req.user.id, productId },
    });

    if (existingItem) {
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { product: true },
      });

      return res
        .status(200)
        .json(new ApiResponse(200, { item: sanitizedCartItem(updatedItem) }, 'Cart item updated'));
    } else {
      const newItem = await prisma.cartItem.create({
        data: { userId: req.user.id, productId, quantity },
        include: { product: true },
      });

      return res
        .status(201)
        .json(new ApiResponse(201, { item: sanitizedCartItem(newItem) }, 'Cart item added'));
    }
  } catch (error) {
    return next(new ApiError(500, 'Unable to add item to cart', [], String(error)));
  }
};

export const removeItemFromCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const { cartItemId } = req.body ?? {};
    if (!cartItemId) {
      return next(new ApiError(400, 'Cart item ID is required'));
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId, userId: req.user.id },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Cart item removed'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to remove item from cart', [], String(error)));
  }
};

export const updateItemQuantity = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const { cartItemId, quantity } = req.body ?? {};
    if (!cartItemId || !quantity || quantity <= 0) {
      return next(new ApiError(400, 'Cart item ID and valid quantity are required'));
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: cartItemId, userId: req.user.id },
      data: { quantity },
    });

    if (!updatedItem) {
      return next(new ApiError(404, 'Cart item not found'));
    }

    const refreshedItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { product: true },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { item: sanitizedCartItem(refreshedItem!) }, 'Cart item quantity updated'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to update item quantity', [], String(error)));
  }
};