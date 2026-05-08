import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Plan-to-hours mapping
const PLAN_HOURS: Record<string, number> = {
  starter: 10,
  pro: 25,
  growth: 50,
  enterprise: 100,
};

export async function POST(request: NextRequest) {
  try {
    // Read the raw body for signature verification
    const body = await request.text();
    const sig = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', message);
      return NextResponse.json(
        { success: false, error: `Webhook signature verification failed: ${message}` },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const type = session.metadata?.type;

        if (!userId) {
          console.error('No user_id in checkout session metadata');
          break;
        }

        if (type === 'subscription') {
          const plan = session.metadata?.plan || 'starter';
          const planHours = PLAN_HOURS[plan] || 10;

          // Update profile with plan info
          await supabase
            .from('profiles')
            .update({
              plan,
              stripe_subscription_id: session.subscription as string,
              plan_started_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          // Add purchased hours
          await upsertWorkHours(supabase, userId, planHours);

          console.log(`Subscription activated: user=${userId} plan=${plan} hours=${planHours}`);
        } else if (type === 'topup') {
          const hours = parseFloat(session.metadata?.hours || '0');

          if (hours > 0) {
            // Add top-up hours
            await upsertWorkHours(supabase, userId, hours);
            console.log(`Top-up completed: user=${userId} hours=${hours}`);
          }
        }

        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;

        // Get user_id from subscription metadata
        let userId: string | undefined;

        if (invoice.subscription) {
          try {
            const subscription = await stripe.subscriptions.retrieve(
              invoice.subscription as string
            );
            userId = subscription.metadata?.user_id;
          } catch (subErr) {
            console.error('Failed to retrieve subscription:', subErr);
          }
        }

        if (!userId) {
          // Try to find user by Stripe customer ID
          const customerId = typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.toString();

          if (customerId) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('stripe_customer_id', customerId)
              .single();

            userId = profile?.id;
          }
        }

        if (userId) {
          // Get the plan from the profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', userId)
            .single();

          const plan = profile?.plan || 'starter';
          const planHours = PLAN_HOURS[plan] || 10;

          // Add recurring subscription hours
          await upsertWorkHours(supabase, userId, planHours);

          console.log(`Invoice paid (recurring): user=${userId} plan=${plan} hours=${planHours}`);
        } else {
          console.error('Could not resolve user_id for invoice:', invoice.id);
        }

        break;
      }

      default: {
        // Log unhandled event types for debugging
        console.log(`Unhandled Stripe event type: ${event.type}`);
      }
    }

    // Always return 200 to acknowledge receipt
    // CRITICAL: This prevents the 271 failed webhooks issue from V1
    // by ensuring we always acknowledge, even for unhandled event types
    return NextResponse.json({ success: true, data: { received: true } });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    // Still return 200 to prevent webhook retries that caused V1 failures
    return NextResponse.json(
      { success: true, data: { received: true, processing_error: true } },
      { status: 200 }
    );
  }
}

async function upsertWorkHours(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  hoursToAdd: number
) {
  // Try to get existing work hours
  const { data: existing } = await supabase
    .from('work_hours')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Update existing record
    await supabase
      .from('work_hours')
      .update({
        total_purchased: existing.total_purchased + hoursToAdd,
        remaining: existing.remaining + hoursToAdd,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } else {
    // Create new record
    await supabase
      .from('work_hours')
      .insert({
        user_id: userId,
        total_purchased: hoursToAdd,
        total_used: 0,
        remaining: hoursToAdd,
      });
  }
}
