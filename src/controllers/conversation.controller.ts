import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { sanitizeConversation } from '../utils/sanitizers';



export const listAllConversations = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return next(new ApiError(401, 'Unauthorized'));
        }

        // Show conversations where user is either buyer or seller
        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    { sellerId: req.user.id },
                    { buyerId: req.user.id }
                ]
            },
            include: {
                product: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1 // Get last message for preview
                }
            }
        });

        const sanitizedConversations = conversations.map(sanitizeConversation);

        return res
            .status(200)
            .json(new ApiResponse(200, { conversations: sanitizedConversations }, 'Conversations retrieved'));
    } catch (error) {
        return next(new ApiError(500, 'Unable to retrieve conversations', [], String(error)));
    }
};

export const listAllConversationsByProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return next(new ApiError(401, 'Unauthorized'));
        }

        const { productId } = req.query;
        if (!productId || typeof productId !== 'string') {
            return next(new ApiError(400, 'Product ID is required'));
        }

        const conversations = await prisma.conversation.findMany({
            where:
            {
                sellerId: req.user.id,
                productId: productId
            },
        });

        const sanitizedConversations = conversations.map(sanitizeConversation);

        return res
            .status(200)
            .json(new ApiResponse(200, { conversations: sanitizedConversations }, 'Conversations retrieved'));
    } catch (error) {
        return next(new ApiError(500, 'Unable to retrieve conversations', [], String(error)));
    }
};

export const startOrGetConversation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return next(new ApiError(401, 'Unauthorized'));
        }

        const { productId } = req.query;
        if (!productId || typeof productId !== 'string') {
            return next(new ApiError(400, 'Product ID is required'));
        }

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return next(new ApiError(404, 'Product not found'));
        }

        const sellerId = product.sellerId;

        // Prevent seller from messaging themselves
        if (sellerId === req.user.id) {
            return next(new ApiError(400, 'You cannot start a conversation about your own product'));
        }

        let conversation = await prisma.conversation.findFirst({
            where: {
                buyerId: req.user.id,
                sellerId,
                productId
            },
            include: { messages: true }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    buyerId: req.user.id,
                    productId,
                    sellerId
                },
                include: { messages: true }
            });
        }

        return res
            .status(200)
            .json(new ApiResponse(200, { conversation: conversation }, 'Conversation retrieved or created'));
    } catch (error) {
        return next(new ApiError(500, 'Unable to retrieve or create conversation', [], String(error)));
    }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return next(new ApiError(401, 'Unauthorized'));
        }

        const { conversationId, content } = req.body as { conversationId: string; content: string } ?? {};
        if (!conversationId || !content) {
            return next(new ApiError(400, 'Conversation ID and content are required'));
        }

        const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
        if (!conversation) {
            return next(new ApiError(404, 'Conversation not found'));
        }

        // Verify user is a participant (either buyer or seller)
        if (conversation.buyerId !== req.user.id && conversation.sellerId !== req.user.id) {
            return next(new ApiError(403, 'You are not a participant in this conversation'));
        }

        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId: req.user.id,
                content
            },
        });

        return res
            .status(201)
            .json(new ApiResponse(201, { message }, 'Message sent'));
    } catch (error) {
        return next(new ApiError(500, 'Unable to send message', [], String(error)));
    }
};
