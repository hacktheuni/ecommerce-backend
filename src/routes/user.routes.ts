import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  changePassword,
} from '../controllers/user.controller.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', authMiddleware, logoutUser);
router.post('/change-password', authMiddleware, changePassword);

export default router;


