import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import type { Decimal } from '@prisma/client/runtime/client';
import { v4 as uuid } from 'uuid';
import { getPaginationParams, getSkip, createPaginatedResponse } from '../utils/pagination';


export const getMyOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const { page, limit } = getPaginationParams(req.query);
    const { status } = req.query;

    const filters: any = { userId: req.user.id };
    if (status) {
      filters.status = String(status);
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: filters,
        include: { items: { include: { product: true } } },
        skip: getSkip(page, limit),
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where: filters }),
    ]);

    const paginatedResponse = createPaginatedResponse(orders, total, page, limit);

    return res
      .status(200)
      .json(new ApiResponse(200, paginatedResponse, 'Orders retrieved'));
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

    // Validate all products before creating order
    for (const item of cartItems) {
      // Check product status
      if (item.product.status !== 'AVAILABLE') {
        return next(new ApiError(400, `Product "${item.product.title}" is not available for purchase`));
      }

      // Check stock availability
      if (item.product.stock !== null && item.product.stock < item.quantity) {
        return next(new ApiError(400, `Insufficient stock for "${item.product.title}". Only ${item.product.stock} available`));
      }
    }

    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + (Number(item.product.price) * item.quantity);
    }, 0);

    const idempotencyKey = uuid();

    // Use transaction to ensure atomicity
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId: req.user!.id,
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

      // Decrement stock for each product
      for (const item of cartItems) {
        if (item.product.stock !== null) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { userId: req.user!.id },
      });

      return newOrder;
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
    const { page, limit } = getPaginationParams(req.query);
    const { status } = req.query;

    const filters: any = {};
    if (status) {
      filters.status = String(status);
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: filters,
        include: { items: { include: { product: true } }, user: true },
        skip: getSkip(page, limit),
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where: filters }),
    ]);

    const paginatedResponse = createPaginatedResponse(orders, total, page, limit);

    return res
      .status(200)
      .json(new ApiResponse(200, paginatedResponse, 'All orders retrieved'));
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