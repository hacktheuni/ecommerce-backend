import { Router } from 'express';
import {
    startOrGetConversation, listAllConversations, sendMessage, listAllConversationsByProduct
} from '../controllers/conversation.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { startConversationSchema, sendMessageSchema } from '../validation/schemas';

const router = Router();

router.get('/', authMiddleware, validate(startConversationSchema), startOrGetConversation);
router.get('/get-conversation', authMiddleware, listAllConversations);
router.get('/get-conversations-by-product', authMiddleware, listAllConversationsByProduct);
router.post('/send-message', authMiddleware, validate(sendMessageSchema), sendMessage);

export default router;
