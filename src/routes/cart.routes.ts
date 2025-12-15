import { Router } from 'express';
import {
    listItemsAndTotal, addItemToCart, removeItemFromCart, updateItemQuantity
} from '../controllers/cart.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { addToCartSchema, updateCartSchema } from '../validation/schemas';

const router = Router();

router.get('/', authMiddleware, listItemsAndTotal);
router.post('/add', authMiddleware, validate(addToCartSchema), addItemToCart);
router.post('/remove', authMiddleware, removeItemFromCart);
router.post('/update', authMiddleware, validate(updateCartSchema), updateItemQuantity);

export default router;
