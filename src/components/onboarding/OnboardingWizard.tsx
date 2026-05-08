'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';

interface WizardStep {
  target: string;
  title: string;
  body: string;
  position: string;
}

interface OnboardingWizardProps {
  steps: WizardStep[];
  userId: string;
}

export default function OnboardingWizard({ steps, userId }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!visible || !steps[currentStep]) return;

    const target = document.getElementById(steps[currentStep].target);
    if (target) {
      const rect = target.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, visible, steps]);

  const handleClose = async () => {
    setVisible(false);
    const supabase = createBrowserClient();
    await supabase
      .from('profiles')
      .update({ onboarding_complete: true })
      .eq('id', userId);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!visible || !steps.length) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  // Calculate card position relative to highlighted element
  const getCardStyle = (): React.CSSProperties => {
    const padding = 16;
    switch (step.position) {
      case 'below':
        return {
          position: 'absolute',
          top: position.top + position.height + padding,
          left: Math.max(padding, position.left),
          zIndex: 10001,
        };
      case 'right':
        return {
          position: 'absolute',
          top: position.top,
          left: position.left + position.width + padding,
          zIndex: 10001,
        };
      case 'left':
        return {
          position: 'absolute',
          top: position.top,
          right: window.innerWidth - position.left + padding,
          zIndex: 10001,
        };
      default:
        return {
          position: 'absolute',
          top: position.top + position.height + padding,
          left: Math.max(padding, position.left),
          zIndex: 10001,
        };
    }
  };

  return (
    <>
      {/* Overlay with cutout */}
      <div
        className="fixed inset-0 z-[10000]"
        style={{
          boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.6)`,
        }}
      >
        {/* Highlighted area cutout */}
        <div
          className="absolute bg-transparent rounded-lg ring-4 ring-[#1D9E75] ring-offset-4"
          style={{
            top: position.top - 8,
            left: position.left - 8,
            width: position.width + 16,
            height: position.height + 16,
          }}
        />
      </div>

      {/* Card */}
      <div style={getCardStyle()}>
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm border border-[#e8e8e4]">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-[#888888] hover:text-[#1a1a1a]"
          >
            <X size={18} />
          </button>

          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">
            {step.title}
          </h3>
          <p className="text-[15px] text-[#888888] mb-5 leading-relaxed">
            {step.body}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentStep ? 'bg-[#1D9E75]' : 'bg-[#e8e8e4]'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#888888] hover:text-[#1a1a1a]"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-1.5 text-sm bg-[#1D9E75] text-white rounded-lg hover:bg-[#178a65]"
              >
                {isLast ? 'Done' : 'Next'} <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Skip link */}
          <button
            onClick={handleClose}
            className="mt-3 text-xs text-[#888888] hover:text-[#1a1a1a] underline"
          >
            Skip tour
          </button>
        </div>
      </div>
    </>
  );
}
