import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.ts';
import { ApiError } from '../utils/ApiError.ts';
import { ApiResponse } from '../utils/ApiResponse.ts';
import { generateAccessToken, generateRefreshToken } from '../utils/auth.ts';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.ts';
import type { Decimal } from '@prisma/client/runtime/client';

const sanitizeConversation = (conversation: { id: string; buyerId: string; sellerId: string; createdAt: Date; }) => ({
    id: conversation.id,
    buyerId: conversation.buyerId,
    sellerId: conversation.sellerId,
    createdAt: conversation.createdAt
});

export const listAllConversations = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return next(new ApiError(401, 'Unauthorized'));
        }

        const conversations = await prisma.conversation.findMany({
            where:
            {
                sellerId: req.user.id
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

        let conversation = await prisma.conversation.findFirst({
            where: {
                buyerId: req.user.id,
                sellerId,
                productId
            },
            include: {messages: true}
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    buyerId: req.user.id,
                    productId,
                    sellerId
                },
                include: {messages: true}
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




