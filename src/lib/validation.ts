import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.string().min(1).max(128),
  variantId: z.string().min(1).max(128),
  quantity: z.number().int().min(1).max(10),
});

export const quoteRequestSchema = z.object({
  items: z.array(cartItemSchema).max(50),
  couponCode: z.string().trim().max(40).optional(),
  shippingMethodId: z.string().max(40).optional(),
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^(\+91)?[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
  country: z.string().trim().default("India"),
});

export const checkoutRequestSchema = quoteRequestSchema.extend({
  idempotencyKey: z.string().min(16).max(64),
  email: z.string().trim().email().max(200),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  shippingMethodId: z.string().min(1).max(40),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1).max(64),
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_signature: z.string().min(1).max(200),
});

export const newsletterSchema = z.object({
  email: z.string().trim().email().max(200),
  consent: z.literal(true),
  company: z.string().max(0).optional(), // honeypot
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(10).max(3000),
  company: z.string().max(0).optional(), // honeypot
});

export const trackSchema = z.object({
  orderId: z.string().trim().min(4).max(64),
  email: z.string().trim().email().max(200),
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
