import { Router } from 'express';
import {
    listItemsAndTotal, addItemToCart, removeItemFromCart, updateItemQuantity
} from '../controllers/cart.controller.ts';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware.ts';

const router = Router();

router.get('/', authMiddleware, listItemsAndTotal);
router.post('/add', authMiddleware, addItemToCart);
router.post('/remove', authMiddleware, removeItemFromCart);
router.post('/update', authMiddleware, updateItemQuantity);

export default router;


