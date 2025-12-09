import { Router } from 'express';
import {
    startOrGetConversation, listAllConversations, sendMessage, listAllConversationsByProduct
} from '../controllers/conversation.controller.ts';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware.ts';

const router = Router();

router.get('/', authMiddleware, startOrGetConversation);
router.get('/get-conversation', authMiddleware, listAllConversations);
router.get('/get-conversations-by-product', authMiddleware, listAllConversationsByProduct);
router.post('/send-message', authMiddleware, sendMessage);


export default router;


