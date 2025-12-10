import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.ts';
import { ApiError } from '../utils/ApiError.ts';
import { ApiResponse } from '../utils/ApiResponse.ts';
import { generateAccessToken, generateRefreshToken } from '../utils/auth.ts';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.ts';
import type { Decimal } from '@prisma/client/runtime/client';
import { v4 as uuid } from 'uuid';


export const getMyOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { orders }, 'Orders retrieved'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to retrieve orders', [], String(error)));
  }
};

export const getOrderById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const { orderId } = req.query;
    if (!orderId || typeof orderId !== 'string') {
      return next(new ApiError(400, 'Order ID is required'));
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user.id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { order }, 'Order retrieved'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to retrieve order', [], String(error)));
  }
};

export const createOrderFromCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return next(new ApiError(400, 'Cart is empty'));
    }

    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + (Number(item.product.price) * item.quantity);
    }, 0);

    const idempotencyKey = uuid();
    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        totalAmount,
        idempotencyKey,
        status: 'PENDING',
        items: {
          create: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: item.product.price,
            productName: item.product.title,
          })),
        },
      },
      include: { items: true },
    });

    await prisma.cartItem.deleteMany({
      where: { userId: req.user.id },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { order }, 'Order placed successfully'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to place order', [], String(error)));
  }
};


// Admin controllers
export const listAllOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: { include: { product: true } }, user: true },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { orders }, 'All orders retrieved'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to retrieve all orders', [], String(error)));
  }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.query;
    const { status } = req.body;

    console.log(orderId, status);
    if (!orderId) {
      return next(new ApiError(400, 'Order ID is required'));
    }
    if (!status || typeof status !== 'string') {
      return next(new ApiError(400, 'Valid status is required'));
    }

    const order = await prisma.order.update({
      where: { id: orderId as string },
      data: { status },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { order }, 'Order status updated'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to update order status', [], String(error)));
  }
};