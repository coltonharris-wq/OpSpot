export interface VerticalConfig {
  id: string;
  industry: string;
  niche: string;
  icon: string;

  sidebar: {
    nicheLabel: string;
    tabs: Array<{
      id: string;
      label: string;
      icon: string;
      component: string;
    }>;
  };

  dashboard: {
    metrics: Array<{
      id: string;
      label: string;
      icon: string;
      defaultValue: string;
      subtitle: string;
    }>;
    activityLabels: {
      jobsLabel: string;
      revenueLabel: string;
    };
  };

  kingMouse: {
    greeting: string;
    quickActions: Array<{
      label: string;
      prompt: string;
    }>;
    systemPrompt: string;
  };

  receptionist: {
    defaultGreeting: string;
    commonReasons: string[];
  };

  wizard: {
    steps: Array<{
      target: string;
      title: string;
      body: string;
      position: string;
    }>;
  };

  leads: {
    serviceTypes: string[];
    statusLabels: string[];
    sourceLabels: string[];
  };

  soul: {
    role: string;
    capabilities: string[];
    terminology: Record<string, string>;
  };
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
  industry: string | null;
  niche: string | null;
  vertical_config_id: string | null;
  location: string | null;
  team_size: string | null;
  tools_used: string[] | null;
  biggest_pain: string | null;
  business_description: string | null;
  website_url: string | null;
  business_intel: Record<string, unknown> | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: string | null;
  plan_started_at: string | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface VM {
  id: string;
  user_id: string;
  orgo_vm_id: string | null;
  ip_address: string | null;
  status: string;
  port: number;
  provision_started_at: string;
  ready_at: string | null;
  last_health_check: string | null;
  error_message: string | null;
  config_json: Record<string, unknown> | null;
}

export interface Message {
  id: string;
  user_id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  niche: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkHours {
  id: string;
  user_id: string;
  total_purchased: number;
  total_used: number;
  remaining: number;
  updated_at: string;
}

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  service_needed: string | null;
  status: string;
  source: string | null;
  notes: string | null;
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CallLogEntry {
  id: string;
  user_id: string;
  caller_name: string | null;
  caller_phone: string | null;
  reason: string | null;
  duration_seconds: number | null;
  result: string | null;
  transcript: string | null;
  recording_url: string | null;
  twilio_call_sid: string | null;
  created_at: string;
}

export interface ReceptionistConfig {
  id: string;
  user_id: string;
  enabled: boolean;
  voice_id: string | null;
  voice_name: string | null;
  phone_number: string | null;
  greeting: string | null;
  business_hours: Record<string, unknown> | null;
}

export interface Connection {
  id: string;
  user_id: string;
  provider: string;
  status: string;
  account_email: string | null;
  connected_at: string;
  last_sync: string | null;
}

export interface UsageEvent {
  id: string;
  user_id: string;
  service: string;
  description: string | null;
  hours_used: number;
  raw_cost: number | null;
  billed_cost: number | null;
  created_at: string;
}

// ── Manus-style types ──────────────────────────────────────────────

export interface VMActivity {
  id: string;
  action: 'search' | 'browse' | 'type' | 'click' | 'think' | 'file_op' | 'system';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: string;
}

export interface TaskStep {
  name: string;
  number: number;
  total: number;
  status: 'pending' | 'in_progress' | 'completed';
  sub_actions: Array<{ icon: string; text: string }>;
}

export interface ScreenshotResponse {
  image: string | null;
  status: 'working' | 'idle' | 'offline';
  current_task: string | null;
  last_active: string | null;
}

export interface ActivityResponse {
  activities: VMActivity[];
  current_step: { name: string; number: number; total: number } | null;
  elapsed_seconds: number;
}

export interface VMActionPayload {
  type: 'click' | 'type' | 'key';
  x?: number;
  y?: number;
  text?: string;
  key?: string;
  double?: boolean;
}

// Industry data for the landing page
export const INDUSTRIES = [
  { id: 'construction', name: 'Construction', icon: 'HardHat', color: '#F07020' },
  { id: 'healthcare', name: 'Healthcare', icon: 'Heart', color: '#1D9E75' },
  { id: 'home-services', name: 'Home services', icon: 'Home', color: '#3B82F6' },
  { id: 'food-drink', name: 'Food & Drink', icon: 'UtensilsCrossed', color: '#EF4444' },
  { id: 'legal', name: 'Legal', icon: 'Scale', color: '#8B5CF6' },
  { id: 'automotive', name: 'Automotive', icon: 'Car', color: '#F59E0B' },
  { id: 'real-estate', name: 'Real estate', icon: 'Building2', color: '#06B6D4' },
  { id: 'retail', name: 'Retail', icon: 'ShoppingBag', color: '#EC4899' },
] as const;

export const NICHES: Record<string, string[]> = {
  'construction': ['Roofing', 'General contractor', 'Electrical', 'Plumbing', 'HVAC', 'Concrete', 'Painting', 'Framing', 'Landscaping', 'Excavation', 'Fencing', 'Drywall', 'Flooring', 'Masonry', 'Welding', 'Solar installation', 'Insulation'],
  'healthcare': ['Dental', 'Chiropractic', 'Med spa', 'Veterinary', 'Optometry', 'Physical therapy', 'Mental health', 'Primary care', 'Pharmacy', 'Dermatology', 'Orthodontics', 'Podiatry', 'Urgent care', 'Home health', 'Cosmetic surgery'],
  'home-services': ['Cleaning', 'Pest control', 'Lawn care', 'Pool service', 'Handyman', 'Locksmith', 'Moving', 'Junk removal', 'Pressure washing', 'Window cleaning', 'Carpet cleaning', 'Appliance repair', 'Garage door', 'Tree service', 'Gutter cleaning'],
  'food-drink': ['Restaurant', 'Catering', 'Food truck', 'Bakery', 'Bar/lounge', 'Coffee shop', 'Meal prep', 'Ghost kitchen', 'Brewery', 'Juice bar', 'Ice cream shop', 'Pizzeria', 'BBQ', 'Sushi', 'Fine dining'],
  'legal': ['Personal injury', 'Family law', 'Criminal defense', 'Estate planning', 'Immigration', 'Business law', 'Real estate law', 'Bankruptcy', 'Tax law', 'Workers comp', 'DUI defense', 'Intellectual property', 'Employment law', 'Civil litigation'],
  'automotive': ['Auto repair', 'Body shop', 'Detailing', 'Tire shop', 'Dealership', 'Towing', 'Oil change', 'Transmission', 'Auto glass', 'Diesel repair', 'Motorcycle', 'Fleet maintenance', 'EV service', 'Alignment', 'Exhaust'],
  'real-estate': ['Residential agent', 'Commercial agent', 'Property management', 'Mortgage broker', 'Home staging', 'Appraisal', 'Title company', 'Inspector', 'Investment', 'HOA management', 'Land sales', 'Vacation rental'],
  'retail': ['Clothing', 'Electronics', 'Jewelry', 'Pet store', 'Sporting goods', 'Furniture', 'Gift shop', 'Vape/smoke', 'Convenience', 'Hardware', 'Florist', 'Bookstore', 'Toy store', 'Art gallery', 'Thrift/consignment'],
};
