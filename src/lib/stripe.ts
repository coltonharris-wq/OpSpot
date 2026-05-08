import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return stripeInstance;
}

export const PRICE_IDS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  growth: process.env.STRIPE_GROWTH_PRICE_ID!,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
  reseller: process.env.STRIPE_RESELLER_PRICE_ID!,
  topup10: process.env.STRIPE_TOPUP_10_PRICE_ID!,
  topup25: process.env.STRIPE_TOPUP_25_PRICE_ID!,
  topup50: process.env.STRIPE_TOPUP_50_PRICE_ID!,
} as const;

export const TOPUP_HOURS: Record<string, number> = {
  [process.env.STRIPE_TOPUP_10_PRICE_ID!]: 10,
  [process.env.STRIPE_TOPUP_25_PRICE_ID!]: 25,
  [process.env.STRIPE_TOPUP_50_PRICE_ID!]: 50,
};

// Work hours cost per API call
export const USAGE_RATES = {
  claude_chat: 0.002,      // ~$0.01 per message
  elevenlabs_tts: 0.01,    // ~$0.05 per minute
  twilio_call: 0.005,      // ~$0.025 per minute
  whisper_local: 0,        // FREE — runs on VM
} as const;
