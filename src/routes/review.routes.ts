import { Router } from 'express';
import {
  listAllReviewsByFilter, addReviewToProduct, deleteReviewFromProduct, updateReview
} from '../controllers/review.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { addReviewSchema, updateReviewSchema } from '../validation/schemas';

const router = Router();

router.get('/list', listAllReviewsByFilter);

router.post('/add', authMiddleware, validate(addReviewSchema), addReviewToProduct);
router.post('/delete', authMiddleware, deleteReviewFromProduct);
router.post('/update', authMiddleware, validate(updateReviewSchema), updateReview);

export default router;
