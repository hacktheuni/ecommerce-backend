import { Router } from 'express';
import {
    reportListedProduct, getAllReports, getReportById, resolveReport, deleteReport
} from '../controllers/report.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createReportSchema } from '../validation/schemas';

const router = Router();

router.post('/create', authMiddleware, validate(createReportSchema), reportListedProduct);

router.get('/all', authMiddleware, adminMiddleware, getAllReports);
router.get('/by-id', authMiddleware, adminMiddleware, getReportById);
router.post('/resolve', authMiddleware, adminMiddleware, resolveReport);
router.post('/delete', authMiddleware, adminMiddleware, deleteReport);

export default router;
