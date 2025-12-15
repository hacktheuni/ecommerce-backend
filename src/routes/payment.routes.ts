import express, { Router } from 'express';
import {
    createCheckoutSession, paymentWebhookHandler
} from '../controllers/payment.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/create-checkout-session', authMiddleware, createCheckoutSession);
router.post('/webhook', express.raw({ type: 'application/json' }), paymentWebhookHandler);

export default router;
