import { Router } from 'express';
import {
    reportListedProduct, getAllReports, getReportById, resolveReport, deleteReport
} from '../controllers/report.controller.ts';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware.ts';

const router = Router();

router.get('/', reportListedProduct)

router.get('/get-all-reports', getAllReports);
router.get('/get-report-by-id', getReportById);
router.post('/resolve-report', resolveReport);
router.post('/delete-report', deleteReport);

export default router;


