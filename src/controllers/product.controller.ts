import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.ts';
import { ApiError } from '../utils/ApiError.ts';
import { ApiResponse } from '../utils/ApiResponse.ts';
import { generateAccessToken, generateRefreshToken } from '../utils/auth.ts';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.ts';
import type { Decimal } from '@prisma/client/runtime/client';

const sanitizeProduct = (product: { id: string; name: string; description: string | null; price: Decimal; }) => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: product.price
});

export const listProductsByFilter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, minPrice, maxPrice } = req.query;

    const filters: any = {};
    if (category) {
      filters.category = String(category);
    }
    console.log(filters)
    if (minPrice) {
      filters.price = { ...filters.price, gte: minPrice };
    }
    console.log(filters)
    if (maxPrice) {
      filters.price = { ...filters.price, lte: maxPrice };
    }
    console.log(filters)

    const products = await prisma.product.findMany({
      where: filters,
    });
    const sanitizedProducts = products.map(sanitizeProduct);

    return res
      .status(200)
      .json(new ApiResponse(200, { products: sanitizedProducts }, 'Filtered products retrieved'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to retrieve filtered products', [], String(error)));
  }
};



// Admin routes
export const createProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, price, stock, category, imageUrl  } = req.body ?? {};
    if (!name || !description || price == null) {
      return next(new ApiError(400, 'Name, description, and price are required'));
    }

    const product = await prisma.product.create({
      data: { name, description, price, stock, category, imageUrl },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { product: sanitizeProduct(product) }, 'Product created'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to create product', [], String(error)));
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.body ?? {};
    if (!productId) {
      return next(new ApiError(400, 'Product ID is required'));
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Product deleted'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to delete product', [], String(error)));
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { productId, name, description, price } = req.body ?? {};
    if (!productId || !name || !description || price == null) {
      return next(new ApiError(400, 'Product ID, name, description, and price are required'));
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { name, description, price },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { product: sanitizeProduct(product) }, 'Product updated'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to update product', [], String(error)));
  }
};

