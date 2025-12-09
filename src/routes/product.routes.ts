import { Router } from 'express';
import {
  createProduct, deleteProduct, updateProduct, listProductsByFilter
} from '../controllers/product.controller.ts';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware.ts';

const router = Router();


router.get('/list', authMiddleware, listProductsByFilter);

router.post('/create', authMiddleware, createProduct);
router.post('/delete', authMiddleware, deleteProduct);
router.post('/update', authMiddleware, updateProduct);

export default router;


