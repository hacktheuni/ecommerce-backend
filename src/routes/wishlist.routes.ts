import { Router } from 'express';
import {
  getMyWishlistProducts, addProductToWishlist, removeProductFromWishlist
} from '../controllers/wishlist.controller.ts';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware.ts';

const router = Router();


router.get('/list', authMiddleware, getMyWishlistProducts);

router.post('/add', authMiddleware, addProductToWishlist);
router.post('/remove', authMiddleware, removeProductFromWishlist);

export default router;


