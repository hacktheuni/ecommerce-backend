import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import type { Decimal } from '@prisma/client/runtime/client';
import type { Condition, ProductStatus } from '../generated/prisma/client/client';

import path from 'path';
import crypto from 'crypto';
import { uploadFileToSupabase, deleteFilesFromSupabase } from '../utils/supabaseStorage';
import { getPaginationParams, getSkip, createPaginatedResponse } from '../utils/pagination';
import { sanitizeProduct } from '../utils/sanitizers';

const BUCKET = 'product-images';

export const listProductsByFilter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, city, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const { page, limit } = getPaginationParams(req.query);

    const filters: any = {};
    if (category) {
      filters.category = String(category);
    }
    if (city) {
      filters.city = String(city);
    }
    if (minPrice) {
      const min = Number(minPrice);
      if (!isNaN(min)) filters.price = { ...filters.price, gte: min };
    }
    if (maxPrice) {
      const max = Number(maxPrice);
      if (!isNaN(max)) filters.price = { ...filters.price, lte: max };
    }

    // Build sort object
    const orderBy: any = {};
    const sortField = String(sortBy);
    if (['createdAt', 'price', 'views'].includes(sortField)) {
      orderBy[sortField] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: filters,
        include: { images: true },
        orderBy,
        skip: getSkip(page, limit),
        take: limit,
      }),
      prisma.product.count({ where: filters }),
    ]);

    const sanitizedProducts = products.map(sanitizeProduct);
    const paginatedResponse = createPaginatedResponse(sanitizedProducts, total, page, limit);

    return res
      .status(200)
      .json(new ApiResponse(200, paginatedResponse, 'Filtered products retrieved'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to retrieve filtered products', [], String(error)));
  }
};

// generate a safe random file name 
function randomFileName(originalName: string) {
  const ext = path.extname(originalName);
  const id = crypto.randomBytes(10).toString('hex');
  const safe = path.basename(originalName, ext).replace(/\s+/g, '-').toLowerCase();
  return `${safe}-${id}${ext}`;
}

//create object path under the user's id folder
function makeObjectPath(userId: string, filename: string) {
  return `${userId}/${filename}`;
}

// Seller routes
export const createProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const files = req.files as {
    productImages?: Express.Multer.File[];
  } | undefined;

  if (!req.user) return next(new ApiError(401, 'Unauthorized'));

  const uploadedPaths: string[] = [];

  try {
    const { title, description, price, stock, category, city, state, country } = req.body as any;

    if (!title || price == null) return next(new ApiError(400, 'title and price are required'));

    // 1) Create product row first (no productImages)
    const product = await prisma.product.create({
      data: {
        sellerId: req.user.id,
        title,
        description: description ?? null,
        price,
        stock: stock ? Number(stock) : 1,
        category: category ?? null,
        city: city ?? null,
        state: state ?? null,
        country: country ?? null,
      },
    });

    // 2) Upload productImages (if any) and prepare productImage rows
    const productImagesFiles = files?.productImages ?? [];
    const imageRows: Array<{ productId: string; url: string; path?: string; altText?: string; order: number }> = [];

    for (let i = 0; i < productImagesFiles.length; i++) {
      const f = productImagesFiles[i];
      const filename = randomFileName(f!.originalname);
      const objectPath = makeObjectPath(req.user.id, filename); // e.g. `${userId}/${filename}`

      const { path: uploadedPath, publicUrl } = await uploadFileToSupabase({
        bucket: BUCKET,
        path: objectPath,
        file: f!.buffer,
        contentType: f!.mimetype,
      });

      uploadedPaths.push(uploadedPath);

      // store url and path 
      imageRows.push({
        productId: product.id,
        url: publicUrl,
        path: uploadedPath,
        altText: '',
        order: i,
      });
    }

    // 3) Insert ProductImage rows (bulk)
    if (imageRows.length > 0) {
      const createData = imageRows.map(r => {
        const base: any = { productId: r.productId, url: r.url, altText: r.altText ?? '', order: r.order };
        if ('path' in r) base.path = r.path;
        return base;
      });

      await prisma.productImage.createMany({ data: createData });
    }

    return res.status(201).json(new ApiResponse(201, { product: sanitizeProduct(product) }, 'Product created'));
  } catch (error) {
    // cleanup uploaded files on failure
    if (uploadedPaths.length > 0) {
      try { await deleteFilesFromSupabase({ bucket: BUCKET, paths: uploadedPaths }); }
      catch (e) { console.error('Cleanup failed', e); }
    }
    console.error('Create product error', error);
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

    // Optionally, verify ownership: only seller or admin can delete
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return next(new ApiError(404, 'Product not found'));
    }
    if (product.sellerId !== req.user.id && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Forbidden'));
    }

    // delete associated product productImages from storage 
    const productImages = await prisma.productImage.findMany({ where: { productId } });
    const pathsToDelete: string[] = productImages.map(img => {
      if (img.path) return img.path;
      return '';
    }).filter(Boolean);

    if (pathsToDelete.length > 0) {
      await deleteFilesFromSupabase({ bucket: BUCKET, paths: pathsToDelete });
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

export const updateProductDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new ApiError(401, 'Unauthorized'));

    const files = req.files as {
      productImages?: Express.Multer.File[];
    } | undefined;

    const { productId, title, description, price, stock, category, city, state, country } = req.body ?? {};
    if (!productId || !title || price == null) {
      return next(new ApiError(400, 'Product ID, title, and price are required'));
    }

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });
    if (!existing) return next(new ApiError(404, 'Product not found'));
    if (existing.sellerId !== req.user.id && req.user.role !== 'admin') return next(new ApiError(403, 'Forbidden'));

    const replacingImages = (files && files.productImages && files.productImages.length > 0);
    const oldPathsToDelete: string[] = [];
    const newlyUploadedPaths: string[] = [];

    // Collect old image paths for deletion 
    if (replacingImages) {
      const oldImages = existing.images ?? [];
      for (const pi of oldImages) {
        if ((pi as any).path) oldPathsToDelete.push((pi as any).path);
      }
    }

    // Upload new images first
    const newImageRows: Array<{ path: string; url: string; filename: string }> = [];
    if (replacingImages) {
      for (let i = 0; i < files!.productImages!.length; i++) {
        const f = files!.productImages![i];
        const filename = randomFileName(f!.originalname);
        const objectPath = makeObjectPath(req.user.id, filename);

        const { path: uploadedPath, publicUrl } = await uploadFileToSupabase({
          bucket: BUCKET,
          path: objectPath,
          file: f!.buffer,
          contentType: f!.mimetype,
        });

        newlyUploadedPaths.push(uploadedPath);
        newImageRows.push({ path: uploadedPath, url: publicUrl, filename });
      }
    }

    // Now update DB inside transaction: update product and if replacing images, delete old rows and insert new ones
    try {
      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: productId },
          data: {
            title,
            description: description ?? null,
            price,
            stock: stock ? Number(stock) : 1,
            category: category ?? null,
            city: city ?? null,
            state: state ?? null,
            country: country ?? null,
          },
        });

        if (replacingImages) {
          // delete old image rows
          await tx.productImage.deleteMany({ where: { productId } });

          // create new rows
          const createData = newImageRows.map((r, idx) => {
            const base: any = { productId, url: r.url, altText: '', order: idx };
            if (r.path) base.path = r.path; // use if model has path
            return base;
          });
          if (createData.length > 0) await tx.productImage.createMany({ data: createData });
        }
      });

      // If DB updated successfully, delete old files (best-effort)
      if (oldPathsToDelete.length > 0) {
        try { await deleteFilesFromSupabase({ bucket: BUCKET, paths: oldPathsToDelete }); }
        catch (e) { console.error('Failed to delete old files', e); }
      }

      const updated = await prisma.product.findUnique({ where: { id: productId }, include: { images: true } });
      return res.status(200).json(new ApiResponse(200, { product: sanitizeProduct(updated!) }, 'Product updated'));
    } catch (dbErr) {
      // rollback uploaded files if DB update failed
      if (newlyUploadedPaths.length > 0) {
        try { await deleteFilesFromSupabase({ bucket: BUCKET, paths: newlyUploadedPaths }); }
        catch (e) { console.error('Failed to cleanup newly uploaded files', e); }
      }
      throw dbErr;
    }
  } catch (error) {
    return next(new ApiError(500, 'Unable to update product', [], String(error)));
  }
};

export const getProductDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.query as { productId: string };
    if (!productId) {
      return next(new ApiError(400, 'Product ID is required'));
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      return next(new ApiError(404, 'Product not found'));
    }

    // Increment view counter atomically
    await prisma.product.update({
      where: { id: productId },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { product: sanitizeProduct(product) }, 'Product details retrieved'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to retrieve product details', [], String(error)));
  }
};

export const addProductImages = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const uploadedPaths: string[] = [];
  try {
    if (!req.user) return next(new ApiError(401, 'Unauthorized'));

    const files = req.files as {
      productImages?: Express.Multer.File[];
    } | undefined;

    const { productId } = req.body ?? {};
    if (!productId) {
      return next(new ApiError(400, 'Product ID is required'));
    }

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });
    if (!existing) return next(new ApiError(404, 'Product not found'));
    if (existing.sellerId !== req.user.id && req.user.role !== 'admin') return next(new ApiError(403, 'Forbidden'));

    const productImagesFiles = files?.productImages ?? [];
    const imageRows: Array<{ productId: string; url: string; path?: string; altText?: string; order: number }> = [];

    for (let i = 0; i < productImagesFiles.length; i++) {
      const f = productImagesFiles[i];
      const filename = randomFileName(f!.originalname);
      const objectPath = makeObjectPath(req.user.id, filename);

      const { path: uploadedPath, publicUrl } = await uploadFileToSupabase({
        bucket: BUCKET,
        path: objectPath,
        file: f!.buffer,
        contentType: f!.mimetype,
      });

      uploadedPaths.push(uploadedPath);

      // store url and path 
      imageRows.push({
        productId: existing.id,
        url: publicUrl,
        path: uploadedPath,
        altText: '',
        order: i,
      });
    }

    // Insert ProductImage rows (bulk)
    if (imageRows.length > 0) {
      const createData = imageRows.map(r => {
        const base: any = { productId: r.productId, url: r.url, altText: r.altText ?? '', order: r.order };
        if ('path' in r) base.path = r.path;
        return base;
      });

      await prisma.productImage.createMany({ data: createData });
    }

    return res.status(201).json(new ApiResponse(201, {}, 'Product images added'));
  } catch (error) {
    // cleanup uploaded files on failure
    if (uploadedPaths.length > 0) {
      try { await deleteFilesFromSupabase({ bucket: BUCKET, paths: uploadedPaths }); }
      catch (e) { console.error('Cleanup failed', e); }
    }
    console.error('Create product error', error);
    return next(new ApiError(500, 'Unable to create product', [], String(error)));
  }
};

export const deleteProductImages = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new ApiError(401, 'Unauthorized'));

    const { productId, imageIds } = req.body ?? {};
    if (!productId || !Array.isArray(imageIds) || imageIds.length === 0) {
      return next(new ApiError(400, 'Product ID and image IDs are required'));
    }

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });
    if (!existing) return next(new ApiError(404, 'Product not found'));
    if (existing.sellerId !== req.user.id && req.user.role !== 'admin') return next(new ApiError(403, 'Forbidden'));

    // Find images to delete
    const imagesToDelete = existing.images.filter(img => imageIds.includes(img.id));
    const pathsToDelete: string[] = imagesToDelete.map(img => {
      if ((img as any).path) return (img as any).path;
      return '';
    }).filter(Boolean);

    // Delete image rows
    await prisma.productImage.deleteMany({
      where: {
        id: { in: imageIds },
        productId,
      },
    });

    // Delete files from storage
    if (pathsToDelete.length > 0) {
      await deleteFilesFromSupabase({ bucket: BUCKET, paths: pathsToDelete });
    }

    return res.status(200).json(new ApiResponse(200, {}, 'Product images deleted'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to delete product images', [], String(error)));
  }
};