import express, { Router } from 'express';
import {
    createCheckoutSession, paymentWebhookHandler
} from '../controllers/payment.controller.ts';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware.ts';

const router = Router();

router.post('/create-checkout-session', createCheckoutSession);
router.post('/webhook', express.raw({ type: 'application/json' }), paymentWebhookHandler);

export default router;


