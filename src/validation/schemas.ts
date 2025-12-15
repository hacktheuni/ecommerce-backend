import { z } from 'zod';

// User schemas
export const registerSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(1, 'Password is required'),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        oldPassword: z.string().min(1, 'Old password is required'),
        newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    }),
});

export const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        phoneNumber: z.string().optional(),
        bio: z.string().optional(),
    }),
});

// Product schemas
export const createProductSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional(),
        price: z.string().or(z.number()).transform(val => Number(val)),
        stock: z.string().or(z.number()).transform(val => Number(val)).optional(),
        category: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
    }),
});

export const updateProductSchema = z.object({
    body: z.object({
        productId: z.string().uuid('Invalid product ID'),
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional(),
        price: z.string().or(z.number()).transform(val => Number(val)),
        stock: z.string().or(z.number()).transform(val => Number(val)).optional(),
        category: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
    }),
});

export const productIdSchema = z.object({
    query: z.object({
        productId: z.string().uuid('Invalid product ID'),
    }),
});

// Cart schemas
export const addToCartSchema = z.object({
    body: z.object({
        productId: z.string().uuid('Invalid product ID'),
        quantity: z.number().int().positive('Quantity must be positive'),
    }),
});

export const updateCartSchema = z.object({
    body: z.object({
        cartItemId: z.string().uuid('Invalid cart item ID'),
        quantity: z.number().int().positive('Quantity must be positive'),
    }),
});

// Review schemas
export const addReviewSchema = z.object({
    body: z.object({
        productId: z.string().uuid('Invalid product ID'),
        rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
        comment: z.string().optional(),
    }),
});

export const updateReviewSchema = z.object({
    body: z.object({
        reviewId: z.string().uuid('Invalid review ID'),
        rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
        comment: z.string().optional(),
    }),
});

// Report schemas
export const createReportSchema = z.object({
    body: z.object({
        productId: z.string().uuid('Invalid product ID'),
        reason: z.string().min(1, 'Reason is required'),
        details: z.string().optional(),
    }),
});

// Order schemas
export const orderIdSchema = z.object({
    query: z.object({
        orderId: z.string().uuid('Invalid order ID'),
    }),
});

export const updateOrderStatusSchema = z.object({
    query: z.object({
        orderId: z.string().uuid('Invalid order ID'),
    }),
    body: z.object({
        status: z.string().min(1, 'Status is required'),
    }),
});

// Conversation schemas
export const startConversationSchema = z.object({
    query: z.object({
        productId: z.string().uuid('Invalid product ID'),
    }),
});

export const sendMessageSchema = z.object({
    body: z.object({
        conversationId: z.string().uuid('Invalid conversation ID'),
        content: z.string().min(1, 'Message content is required'),
    }),
});
