import { Router } from 'express';
import multer from 'multer';
import {
  createProduct, deleteProduct, updateProductDetails, listProductsByFilter,
  getProductDetails, addProductImages, deleteProductImages
} from '../controllers/product.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// multer memory storage so files are available in req.files.buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

router.get('/list', authMiddleware, listProductsByFilter);

router.post(
  '/create',
  authMiddleware,
  upload.fields([
    { name: 'productImages', maxCount: 6 },
  ]),
  createProduct
);

router.post('/delete', authMiddleware, deleteProduct);
router.post('/update-product-details', authMiddleware, updateProductDetails);
router.get('/get-product-details', authMiddleware, getProductDetails);
router.post('/add-product-images', authMiddleware, addProductImages);
router.post('/delete-product-images', authMiddleware, deleteProductImages);

export default router;
