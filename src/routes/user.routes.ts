import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  changePassword,
  updateProfile,
  getUserProfile,
  regenerateAccessToken,
  sendEmailForVerification,
  verifyEmail
} from '../controllers/user.controller.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { get } from 'node:http';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', authMiddleware, logoutUser);
router.post('/change-password', authMiddleware, changePassword);
router.post('/update-profile', authMiddleware, updateProfile);
router.get('/profile', authMiddleware, getUserProfile);
router.post('/refresh-token', regenerateAccessToken);

router.get('/send-email', authMiddleware, sendEmailForVerification);
router.post('/verify-email', authMiddleware, verifyEmail);

export default router;


