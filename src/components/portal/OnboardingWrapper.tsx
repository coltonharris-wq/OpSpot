'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { OnboardingWizard } from './OnboardingWizard';
import type { VerticalConfig } from '@/lib/types';

interface OnboardingWrapperProps {
  config: VerticalConfig | null;
  onboardingComplete: boolean;
}

export function OnboardingWrapper({ config, onboardingComplete }: OnboardingWrapperProps) {
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (!onboardingComplete) {
      setShowWizard(true);
    }
  }, [onboardingComplete]);

  async function handleComplete() {
    setShowWizard(false);
    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ onboarding_complete: true })
          .eq('id', user.id);
      }
    } catch {
      // silently fail - wizard still closes
    }
    window.location.href = '/king-mouse';
  }

  if (!showWizard) return null;

  return <OnboardingWizard config={config} onComplete={handleComplete} />;
}
