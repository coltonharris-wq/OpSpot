import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Subscription plan price IDs (set these in your Stripe dashboard)
const PLAN_PRICES: Record<string, { price_id: string; name: string; mode: 'subscription' }> = {
  starter: {
    price_id: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
    name: 'Starter',
    mode: 'subscription',
  },
  pro: {
    price_id: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    name: 'Pro',
    mode: 'subscription',
  },
  growth: {
    price_id: process.env.STRIPE_GROWTH_PRICE_ID || 'price_growth',
    name: 'Growth',
    mode: 'subscription',
  },
  enterprise: {
    price_id: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    name: 'Enterprise',
    mode: 'subscription',
  },
};

// Top-up price IDs
const TOPUP_PRICES: Record<string, { price_id: string; hours: number; name: string }> = {
  '10hr': {
    price_id: process.env.STRIPE_TOPUP_10_PRICE_ID || 'price_topup_10',
    hours: 10,
    name: '10 Hour Top-Up',
  },
  '25hr': {
    price_id: process.env.STRIPE_TOPUP_25_PRICE_ID || 'price_topup_25',
    hours: 25,
    name: '25 Hour Top-Up',
  },
  '50hr': {
    price_id: process.env.STRIPE_TOPUP_50_PRICE_ID || 'price_topup_50',
    hours: 50,
    name: '50 Hour Top-Up',
  },
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan, topup } = body;

    if (!plan && !topup) {
      return NextResponse.json(
        { success: false, error: 'Either plan or topup is required' },
        { status: 400 }
      );
    }

    const baseUrl = request.nextUrl.origin;

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    let stripeCustomerId = profile?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || undefined,
        metadata: {
          user_id: user.id,
          company: profile?.company_name || '',
        },
      });

      stripeCustomerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);
    }

    let sessionConfig: Stripe.Checkout.SessionCreateParams;

    if (plan) {
      // Subscription checkout
      const planConfig = PLAN_PRICES[plan];
      if (!planConfig) {
        return NextResponse.json(
          { success: false, error: `Invalid plan: ${plan}. Valid plans: ${Object.keys(PLAN_PRICES).join(', ')}` },
          { status: 400 }
        );
      }

      sessionConfig = {
        customer: stripeCustomerId,
        mode: 'subscription',
        line_items: [{ price: planConfig.price_id, quantity: 1 }],
        success_url: `${baseUrl}/billing?success=true&plan=${plan}`,
        cancel_url: `${baseUrl}/billing?canceled=true`,
        metadata: {
          user_id: user.id,
          type: 'subscription',
          plan,
        },
        subscription_data: {
          metadata: {
            user_id: user.id,
            plan,
          },
        },
      };
    } else {
      // Top-up checkout
      const topupConfig = TOPUP_PRICES[topup];
      if (!topupConfig) {
        return NextResponse.json(
          { success: false, error: `Invalid top-up: ${topup}. Valid options: ${Object.keys(TOPUP_PRICES).join(', ')}` },
          { status: 400 }
        );
      }

      sessionConfig = {
        customer: stripeCustomerId,
        mode: 'payment',
        line_items: [{ price: topupConfig.price_id, quantity: 1 }],
        success_url: `${baseUrl}/billing?success=true&topup=${topup}`,
        cancel_url: `${baseUrl}/billing?canceled=true`,
        metadata: {
          user_id: user.id,
          type: 'topup',
          topup,
          hours: topupConfig.hours.toString(),
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      success: true,
      data: { checkout_url: session.url },
    });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
