import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { sanitizeCartItem } from '../utils/sanitizers';



export const listItemsAndTotal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true },
    });

    const sanitizedItems = cartItems.map(sanitizeCartItem);
    const totalPrice = sanitizedItems.reduce((total: number, item: any) => total + (item.product.price.toNumber() * item.quantity), 0);

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

    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return next(new ApiError(404, 'Product not found'));
    }

    // Prevent users from adding their own products to cart
    if (product.sellerId === req.user.id) {
      return next(new ApiError(400, 'You cannot add your own product to cart'));
    }

    // Check product status - only AVAILABLE products can be added
    if (product.status !== 'AVAILABLE') {
      return next(new ApiError(400, 'This product is not available for purchase'));
    }

    // Validate stock availability
    if (product.stock !== null && product.stock < quantity) {
      return next(new ApiError(400, `Only ${product.stock} items available in stock`));
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: { userId: req.user.id, productId },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      // Validate total quantity against stock
      if (product.stock !== null && product.stock < newQuantity) {
        return next(new ApiError(400, `Only ${product.stock} items available in stock`));
      }

      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: { product: true },
      });

      return res
        .status(200)
        .json(new ApiResponse(200, { item: sanitizeCartItem(updatedItem) }, 'Cart item updated'));
    } else {
      const newItem = await prisma.cartItem.create({
        data: { userId: req.user.id, productId, quantity },
        include: { product: true },
      });

      return res
        .status(201)
        .json(new ApiResponse(201, { item: sanitizeCartItem(newItem) }, 'Cart item added'));
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

    // Fetch cart item with product to validate stock
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { product: true },
    });

    if (!cartItem) {
      return next(new ApiError(404, 'Cart item not found'));
    }

    // Verify ownership
    if (cartItem.userId !== req.user.id) {
      return next(new ApiError(403, 'Forbidden'));
    }

    // Validate product status
    if (cartItem.product.status !== 'AVAILABLE') {
      return next(new ApiError(400, 'This product is no longer available'));
    }

    // Validate stock availability
    if (cartItem.product.stock !== null && cartItem.product.stock < quantity) {
      return next(new ApiError(400, `Only ${cartItem.product.stock} items available in stock`));
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: { product: true },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { item: sanitizeCartItem(updatedItem) }, 'Cart item quantity updated'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to update item quantity', [], String(error)));
  }
};