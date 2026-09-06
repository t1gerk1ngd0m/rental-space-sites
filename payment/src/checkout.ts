import { z } from 'zod';
import Stripe from 'stripe';
import { AMOUNT_MIN, AMOUNT_MAX, DELIVERY_METHODS } from './config';
import { PAID_OPTIONS } from './options';
import { SPACE_KEYS, type Space } from './spaces';
import type { DeliveryMethod } from './config';

const OPTION_IDS = PAID_OPTIONS.map((o) => o.id);

export const orderSchema = z.object({
  space: z.enum(SPACE_KEYS as [Space, ...Space[]]),
  amount: z.coerce.number().int().min(AMOUNT_MIN).max(AMOUNT_MAX),
  delivery: z.enum(DELIVERY_METHODS),
  options: z.array(z.enum(OPTION_IDS as [string, ...string[]])).default([]),
});

export type Order = z.infer<typeof orderSchema>;

/**
 * multipart/urlencoded のフォーム値を注文として解釈する。
 * options は同名フィールドの繰り返しなので parseBody({ all: true }) の結果を配列に正規化する。
 */
export function parseOrder(body: Record<string, unknown>) {
  const rawOptions = body['options'];
  const options =
    rawOptions === undefined ? [] : Array.isArray(rawOptions) ? rawOptions : [rawOptions];

  return orderSchema.safeParse({
    space: body['space'],
    amount: body['amount'],
    delivery: body['delivery'],
    options,
  });
}

export function buildLineItems(order: Order): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: 'jpy',
        product_data: { name: 'Prime Video レンタル料金' },
        unit_amount: order.amount,
      },
      quantity: 1,
    },
  ];

  for (const id of order.options) {
    const option = PAID_OPTIONS.find((o) => o.id === id);
    if (!option) continue;
    items.push({
      price_data: {
        currency: 'jpy',
        product_data: { name: option.name },
        unit_amount: option.amount,
      },
      quantity: 1,
    });
  }

  return items;
}

export function createStripeClient(apiKey: string): Stripe {
  return new Stripe(apiKey, { httpClient: Stripe.createFetchHttpClient() });
}

export function pinFor(env: { PIN_YOKOHAMA?: string; PIN_OFUNA?: string }, space: Space) {
  switch (space) {
    case 'yokohama':
      return env.PIN_YOKOHAMA;
    case 'ofuna':
      return env.PIN_OFUNA;
  }
}

export type { DeliveryMethod };
