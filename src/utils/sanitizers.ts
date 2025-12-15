import type { Decimal } from '@prisma/client/runtime/client';

export const sanitizeUser = (user: {
    id: string;
    email: string;
    role: string;
    name?: string | null;
    phoneNumber?: string | null;
    bio?: string | null;
    isVerified?: boolean;
    createdAt: Date;
}) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    phoneNumber: user.phoneNumber,
    bio: user.bio,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
});

export const sanitizeProduct = (product: any) => ({
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    stock: product.stock,
    status: product.status,
    condition: product.condition,
    isNegotiable: product.isNegotiable,
    category: product.category,
    city: product.city,
    state: product.state,
    country: product.country,
    views: product.views,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    sellerId: product.sellerId,
    images: product.images,
    seller: product.seller ? sanitizeUser(product.seller) : undefined,
});

export const sanitizeCartItem = (item: {
    id: string;
    productId: string;
    quantity: number;
    product: any;
}) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    product: sanitizeProduct(item.product),
});

export const sanitizeOrder = (order: any) => ({
    id: order.id,
    userId: order.userId,
    status: order.status,
    totalAmount: order.totalAmount,
    shippingAddr: order.shippingAddr,
    paymentStatus: order.paymentStatus,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items,
    user: order.user ? sanitizeUser(order.user) : undefined,
});

export const sanitizeReview = (review: any) => ({
    id: review.id,
    userId: review.userId,
    productId: review.productId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    user: review.user ? sanitizeUser(review.user) : undefined,
});

export const sanitizeConversation = (conversation: any) => ({
    id: conversation.id,
    buyerId: conversation.buyerId,
    sellerId: conversation.sellerId,
    productId: conversation.productId,
    createdAt: conversation.createdAt,
    messages: conversation.messages,
    product: conversation.product ? sanitizeProduct(conversation.product) : undefined,
});

export const sanitizeReport = (report: any) => ({
    id: report.id,
    productId: report.productId,
    reporterId: report.reporterId,
    reason: report.reason,
    details: report.details,
    resolved: report.resolved,
    createdAt: report.createdAt,
    product: report.product ? sanitizeProduct(report.product) : undefined,
    reporter: report.reporter ? sanitizeUser(report.reporter) : undefined,
});
