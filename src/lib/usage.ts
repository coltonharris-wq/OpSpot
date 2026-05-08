import { createServiceClient } from './supabase-server';
import { USAGE_RATES } from './stripe';

type ServiceType = keyof typeof USAGE_RATES;

export async function logUsage(
  userId: string,
  service: ServiceType,
  description: string,
  durationMinutes?: number
): Promise<{ remaining: number }> {
  const supabase = createServiceClient();

  // Calculate hours based on service type
  let hoursUsed = USAGE_RATES[service];
  if (durationMinutes && service !== 'whisper_local') {
    hoursUsed = USAGE_RATES[service] * durationMinutes;
  }

  // Skip if free service
  if (hoursUsed === 0) {
    const { data: hours } = await supabase
      .from('work_hours')
      .select('remaining')
      .eq('user_id', userId)
      .single();
    return { remaining: hours?.remaining || 0 };
  }

  const billedCost = hoursUsed * 4.98;

  // Log usage event
  await supabase.from('usage_events').insert({
    user_id: userId,
    service,
    description,
    hours_used: hoursUsed,
    billed_cost: billedCost,
  });

  // Deduct from work hours
  const { data: hours } = await supabase
    .from('work_hours')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (hours) {
    const newUsed = Number(hours.total_used) + hoursUsed;
    const newRemaining = Number(hours.total_purchased) - newUsed;

    await supabase
      .from('work_hours')
      .update({
        total_used: newUsed,
        remaining: Math.max(0, newRemaining),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    return { remaining: Math.max(0, newRemaining) };
  }

  return { remaining: 0 };
}

export async function checkHoursRemaining(userId: string): Promise<number> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('work_hours')
    .select('remaining')
    .eq('user_id', userId)
    .single();

  return data?.remaining || 0;
}

export async function addHours(userId: string, hours: number): Promise<void> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('work_hours')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (data) {
    await supabase
      .from('work_hours')
      .update({
        total_purchased: Number(data.total_purchased) + hours,
        remaining: Number(data.remaining) + hours,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }
}
