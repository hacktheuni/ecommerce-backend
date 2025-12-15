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
} from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema
} from '../validation/schemas';

const router = Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/logout', authMiddleware, logoutUser);
router.post('/change-password', authMiddleware, validate(changePasswordSchema), changePassword);
router.post('/update-profile', authMiddleware, validate(updateProfileSchema), updateProfile);
router.get('/profile', authMiddleware, getUserProfile);
router.post('/refresh-token', regenerateAccessToken);

router.get('/send-email', authMiddleware, sendEmailForVerification);
router.post('/verify-email', authMiddleware, verifyEmail);

export default router;
