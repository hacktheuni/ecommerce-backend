import { Router } from 'express';
import {
    getMyOrders, createOrderFromCart, getOrderById, listAllOrders, updateOrderStatus
} from '../controllers/order.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, getMyOrders);
router.get('/get-order', authMiddleware, getOrderById);
router.post('/create-order', authMiddleware, createOrderFromCart);

router.get('/list-all-orders', authMiddleware, adminMiddleware, listAllOrders);
router.post('/update/status', authMiddleware, adminMiddleware, updateOrderStatus);

export default router;
