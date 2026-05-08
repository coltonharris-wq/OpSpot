import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getVerticalConfig } from '@/lib/config-loader';
import { Sidebar } from '@/components/portal/Sidebar';
import { TopBar } from '@/components/portal/TopBar';
import { OnboardingWrapper } from '@/components/portal/OnboardingWrapper';
import type { Profile } from '@/lib/types';

function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can fail in Server Components if called after
            // the response headers have already been sent.
          }
        },
      },
    }
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Load vertical config based on profile niche
  const nicheId = profile?.vertical_config_id || (profile?.niche ? slugify(profile.niche) : null);
  const config = nicheId ? getVerticalConfig(nicheId) : null;

  const safeProfile: Profile = profile ?? {
    id: user.id,
    email: user.email ?? '',
    full_name: null,
    phone: null,
    company_name: null,
    industry: null,
    niche: null,
    vertical_config_id: null,
    location: null,
    team_size: null,
    tools_used: null,
    biggest_pain: null,
    business_description: null,
    website_url: null,
    business_intel: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    plan: null,
    plan_started_at: null,
    onboarding_complete: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Fixed sidebar */}
      <Sidebar config={config} profile={safeProfile} />

      {/* Main area: topbar + scrollable content */}
      <div style={{ marginLeft: 260, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Fixed top bar */}
        <TopBar profile={safeProfile} />

        {/* Scrollable content */}
        <main
          style={{
            marginTop: 40,
            flex: 1,
            backgroundColor: '#f6f6f4',
            overflowY: 'auto',
          }}
        >
          {children}
        </main>
      </div>

      {/* Onboarding wizard overlay */}
      <OnboardingWrapper config={config} onboardingComplete={safeProfile.onboarding_complete} />
    </div>
  );
}
