import { Router } from 'express';
import {
  listAllReviewsByFilter, addReivewToProduct, deleteReviewFromProduct, updateReview
} from '../controllers/review.controller.ts';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware.ts';

const router = Router();


router.get('/list', authMiddleware, listAllReviewsByFilter);

router.post('/add', authMiddleware, addReivewToProduct);
router.post('/delete', authMiddleware, deleteReviewFromProduct);
router.post('/update', authMiddleware, updateReview);

export default router;


