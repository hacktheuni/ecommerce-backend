import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import reviewRoutes from './routes/review.routes';
import wishlistRoutes from './routes/wishlist.routes';
import conversationRoutes from './routes/conversation.routes';
import reportRoutes from './routes/report.routes';
import paymentRoutes from './routes/payment.routes';
import { ApiError } from './utils/ApiError';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.static("public"));

// Stripe webhook needs raw body, so register it BEFORE the JSON parser
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/user', userRoutes);
app.use('/api/product', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/payment', paymentRoutes);

// Global error handler
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({
        statusCode: err.statusCode,
        message: err.message,
        errors: err.errors,
        success: err.success,
      });
    }

    return res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
      errors: [String(err)],
      success: false,
    });
  },
);

export { app };


