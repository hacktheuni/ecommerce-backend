import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.ts';
import { ApiError } from '../utils/ApiError.ts';
import { ApiResponse } from '../utils/ApiResponse.ts';
import { generateAccessToken, generateRefreshToken } from '../utils/auth.ts';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.ts';
import type { Decimal } from '@prisma/client/runtime/client';
import type { Condition, ProductStatus } from '../generated/prisma/client/client.ts';

const sanitizeProduct = (product: { id: string; title: string; description: string | null; price: Decimal; }) => ({
  id: product.id,
  title: product.title,
  description: product.description,
  price: product.price
});

export const listProductsByFilter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, city, minPrice, maxPrice } = req.query;

    const filters: any = {};
    if (category) {
      filters.category = String(category);
    }
    console.log(filters)
    if (city) {
      filters.city = String(city);
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



// Seller routes
export const createProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

  try {

    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const { title, description, price, stock, status, condition, isNegotiable, category, city, state, country, latitude, longitude, imageUrl, views  } = req.body as { sellerId: string; title: string; description: string | null; price: Decimal; stock: number; status: ProductStatus; condition: Condition; isNegotiable: boolean; category: string; city: string; state: string; country: string; latitude: number; longitude: number; imageUrl: string; views: number } ?? {};

    if (!title || price == null) {
      return next(new ApiError(400, 'title and price are required'));
    }
    
    const product = await prisma.product.create({
      data: { sellerId: req.user.id, title, description, price, stock, status, condition, isNegotiable, category, city, state, country, latitude, longitude, imageUrl, views },
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

    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

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

    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    const { productId, title, description, price } = req.body ?? {};
    if (!productId || !title || !description || price == null) {
      return next(new ApiError(400, 'Product ID, title, description, and price are required'));
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { title, description, price },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { product: sanitizeProduct(product) }, 'Product updated'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to update product', [], String(error)));
  }
};

