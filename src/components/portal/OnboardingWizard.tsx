'use client';

import { useState, useEffect, useCallback } from 'react';
import type { VerticalConfig } from '@/lib/types';

interface WizardStep {
  target: string;
  title: string;
  body: string;
  position: 'right' | 'below' | 'left' | 'above';
}

const DEFAULT_STEPS: WizardStep[] = [
  { target: '[href="/king-mouse"]', title: 'Chat with King Mouse anytime', body: 'This is your AI employee. Ask it anything \u2014 follow up on leads, check your schedule, write emails, or run reports.', position: 'right' },
  { target: '[href="/dashboard"]', title: 'This is your command center', body: 'Your dashboard shows everything happening in your business \u2014 calls, leads, revenue, and tasks. All managed by King Mouse.', position: 'right' },
  { target: '[href="/receptionist"]', title: 'Your AI receptionist', body: 'King Mouse answers your business phone 24/7. Pick a voice, connect your number, and never miss a call again.', position: 'right' },
  { target: '[href="/tasks"]', title: 'Your task manager', body: 'King Mouse tracks and manages tasks for your business. See what\u2019s been done, what\u2019s in progress, and what\u2019s next.', position: 'right' },
  { target: '[href="/connections"]', title: 'Connect your tools in 10 seconds', body: 'Link Gmail, QuickBooks, Google Calendar, and 50+ more apps so King Mouse can work with your existing tools.', position: 'right' },
  { target: '[href="/billing"]', title: 'Billing & hours', body: 'Monitor your AI hours usage, purchase more time, and manage your subscription \u2014 all in one place.', position: 'right' },
];

interface OnboardingWizardProps {
  config: VerticalConfig | null;
  onComplete: () => void;
}

export function OnboardingWizard({ config, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps: WizardStep[] = (config?.wizard?.steps as WizardStep[]) || DEFAULT_STEPS;
  const totalSteps = steps.length;
  const currentStep = steps[step];

  const updateTargetRect = useCallback(() => {
    if (!currentStep) return;
    const el = document.querySelector(currentStep.target);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    return () => window.removeEventListener('resize', updateTargetRect);
  }, [step, updateTargetRect]);

  function handleNext() {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  }

  if (!visible || !currentStep) return null;

  // Calculate tooltip position
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 60,
    maxWidth: 340,
    background: '#1e2a3a',
    borderRadius: 14,
    padding: '24px 20px 20px',
    border: '1px solid rgba(93,202,165,0.3)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  };

  if (targetRect) {
    const pos = currentStep.position;
    if (pos === 'right') {
      tooltipStyle.left = targetRect.right + 16;
      tooltipStyle.top = targetRect.top;
    } else if (pos === 'below') {
      tooltipStyle.left = targetRect.left;
      tooltipStyle.top = targetRect.bottom + 12;
    } else if (pos === 'left') {
      tooltipStyle.right = window.innerWidth - targetRect.left + 16;
      tooltipStyle.top = targetRect.top;
    } else {
      tooltipStyle.left = targetRect.left;
      tooltipStyle.bottom = window.innerHeight - targetRect.top + 12;
    }
  } else {
    tooltipStyle.left = '50%';
    tooltipStyle.top = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <>
      {/* Dim all sidebar links except the highlighted one */}
      <style>{`
        aside a {
          color: rgba(255,255,255,0.3) !important;
          background-color: transparent !important;
          border-left-color: transparent !important;
        }
        aside a${currentStep.target} {
          color: #ffffff !important;
          background-color: rgba(93,202,165,0.12) !important;
          border-left-color: #5DCAA5 !important;
        }
      `}</style>

      {/* Click-blocking overlay (visual dimming comes from cutout box-shadow) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          backgroundColor: targetRect ? 'transparent' : 'rgba(0,0,0,0.5)',
          pointerEvents: 'auto',
        }}
      />

      {/* Highlight cutout on target */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            left: targetRect.left - 4,
            top: targetRect.top - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            borderRadius: 8,
            border: '2px solid #5DCAA5',
            zIndex: 55,
            boxShadow: '0 0 0 4000px rgba(0,0,0,0.5), 0 0 15px rgba(93,202,165,0.5)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tooltip card */}
      <div style={tooltipStyle}>
        {/* Step label */}
        <div style={{ fontSize: 11, color: '#5DCAA5', fontWeight: 500, marginBottom: 8 }}>
          Step {step + 1} of {totalSteps}
        </div>

        {/* Title */}
        <div style={{ fontSize: 17, fontWeight: 500, color: '#fff', marginBottom: 8 }}>
          {currentStep.title}
        </div>

        {/* Body */}
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 20 }}>
          {currentStep.body}
        </div>

        {/* Bottom: dots + button + skip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Dots */}
          <div style={{ display: 'flex', gap: 5 }}>
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: i === step ? '#5DCAA5' : 'rgba(255,255,255,0.15)',
                  transition: 'background 0.2s',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Skip link */}
            <button
              onClick={onComplete}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.35)',
                fontSize: 12,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Skip tour
            </button>

            {/* Next button */}
            <button
              onClick={handleNext}
              style={{
                background: '#F07020',
                color: '#fff',
                border: 'none',
                padding: '8px 20px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {step === totalSteps - 1 ? 'Get started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
