import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { Decimal } from '@prisma/client/runtime/client';
import Stripe from 'stripe';
import { config } from '../config/config';

const stripe = new Stripe(config.stripeSecretKey!, { apiVersion: '2025-11-17.clover' });

export const createCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.body;
    if (!orderId || typeof orderId !== 'string') {
      return next(new ApiError(400, 'Order ID is required'));
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }


    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: order.items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product.title,
            description: item.product.description as string,
          },
          unit_amount: Math.round(Number(item.product.price) * 100),
        },
        quantity: item.quantity,
      })),
      success_url: `http://localhost:3000/api/payment/webhook`,
      cancel_url: `https://your-site.com/cart`,
      metadata: {
        orderId: String(order.id)
      }
    }, {
      idempotencyKey: order.idempotencyKey
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id }
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { sessionId: session.id }, 'Checkout session created'));
  } catch (error) {
    return next(new ApiError(500, 'Unable to create checkout session', [], String(error)));
  }
};

export const paymentWebhookHandler = async (req: Request, res: Response, next: NextFunction) => {
  const webhookSecret = config.stripeWebhookSecret;
  const sig = req.headers['stripe-signature'] as string | undefined;

  if (!webhookSecret) return next(new ApiError(500, 'Stripe webhook secret not configured'));
  if (!sig) return next(new ApiError(400, 'Missing stripe-signature header'));

  const rawBody = req.body as Buffer;
  if (!rawBody || !(rawBody instanceof Buffer)) return next(new ApiError(400, 'Invalid webhook payload'));

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    return next(new ApiError(400, 'Webhook signature verification failed', [], String(err?.message ?? err)));
  }
  console.log("Webhook type:", event.type);
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (!orderId || typeof orderId !== 'string') break;

        const paymentIntentId = (session.payment_intent as string) || null;
        const amountTotal = session.amount_total ?? 0;
        const currency = (session.currency ?? 'usd').toUpperCase();
        let chargeId: string | null = null;

        // Fetch payment intent to get charge ID
        if (paymentIntentId) {
          const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
          chargeId = pi.latest_charge ? (pi.latest_charge as string) : null;
        }

        await prisma.$transaction([
          prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'PAID',
              stripePaymentIntentId: paymentIntentId,
              paymentStatus: 'SUCCEEDED',
              paidAt: new Date(),
            },
          }),
          prisma.payment.upsert({
            where: { stripePaymentIntentId: paymentIntentId || '' },
            update: {
              amount: new Decimal(amountTotal / 100),
              currency: currency,
              stripeChargeId: chargeId,
              status: 'SUCCEEDED',
              updatedAt: new Date(),
            },
            create: {
              orderId,
              amount: new Decimal(amountTotal / 100),
              currency: currency,
              stripePaymentIntentId: paymentIntentId,
              stripeChargeId: chargeId,
              status: 'SUCCEEDED',
            },
          }),
        ]);

        break;
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = pi.id;
        const chargeId = pi.latest_charge ? (pi.latest_charge as string) : null;

        const payment = await prisma.payment.findUnique({ where: { stripePaymentIntentId: paymentIntentId } });
        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCEEDED',
              stripeChargeId: chargeId ?? payment.stripeChargeId,
              updatedAt: new Date(),
            },
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = pi.id;

        const payment = await prisma.payment.findUnique({ where: { stripePaymentIntentId: paymentIntentId } });
        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED', updatedAt: new Date() },
          });
        }
        break;
      }

      case 'charge.refunded': {
        const ch = event.data.object as Stripe.Charge;
        const chargeId = ch.id;

        const payment = await prisma.payment.findUnique({ where: { stripeChargeId: chargeId } });
        if (payment && payment.orderId) {
          // Create refund record
          const refundId = (ch.refunds?.data?.[0]?.id as string) || null;
          const refundedAmount = (ch as any).refunded || 0; // amount refunded in cents
          const refundAmount = refundedAmount > 0 ? new Decimal(String(refundedAmount / 100)) : payment.amount;

          await prisma.$transaction([
            prisma.refund.create({
              data: {
                paymentId: payment.id,
                amount: refundAmount,
                currency: payment.currency,
                reason: 'refunded',
                stripeRefundId: refundId,
                status: 'succeeded',
              },
            }),
            prisma.payment.update({
              where: { id: payment.id },
              data: { status: 'REFUNDED', updatedAt: new Date() },
            }),
            prisma.order.update({
              where: { id: payment.orderId },
              data: { status: 'REFUNDED', paymentStatus: 'REFUNDED', updatedAt: new Date() },
            }),
          ]);
        }
        break;
      }

      default:
        // ignore other events
        break;
    }

    return res.status(200).json(new ApiResponse(200, { received: true }, 'Webhook processed'));
  } catch (err: any) {
    return next(new ApiError(500, 'Error processing webhook event', [], String(err?.message ?? err)));
  }
};