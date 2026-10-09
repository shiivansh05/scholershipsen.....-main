import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2, ChevronRight, X } from 'lucide-react';

interface DemoWalkthroughProps {
  currentStep: number;
  isOpen: boolean;
  onClose: () => void;
  onGoToStep: (step: number) => void;
}

export const DEMO_STEPS = [
  {
    step: 1,
    title: '1. National Scale Overview',
    desc: '10,000 applications processed across 60 institutions. 8,940 verified normal; only 240 high-risk concentrated in 12 explainable anomaly clusters.',
    actionLabel: 'Explore High-Risk Clusters',
    targetTab: 'clusters',
  },
  {
    step: 2,
    title: '2. Select Hero Cluster CL-104',
    desc: 'Target CL-104 (Cross-Institution Shared Bank & Mobile Ring). Score 87 reflects convergence of 5 distinct abnormal signals.',
    actionLabel: 'Inspect CL-104 Hero Cluster',
    targetTab: 'cluster-detail',
  },
  {
    step: 3,
    title: '3. Explore 3D Topology',
    desc: 'Witness 4 students across 3 separate colleges funnelling into single Bank BA103 and Mobile 98710003 with reused document template #991.',
    actionLabel: 'Inspect Convergence Graph',
    targetTab: 'cluster-detail',
  },
  {
    step: 4,
    title: '4. Transparent Signal Breakdown',
    desc: 'Every point is justified: Shared Bank (+25) + Shared Mobile (+20) + Cross-College Link (+15) + Low Attendance 11.8% (+15) + Document Hash (+12) = 87.',
    actionLabel: 'Review Points Breakdown',
    targetTab: 'cluster-detail',
  },
  {
    step: 5,
    title: '5. Officer Takes Action',
    desc: 'Human decides. Execute formal investigative actions: Assign field investigator, request branch mandate, or escalate to Anti-Corruption Bureau.',
    actionLabel: 'Simulate Officer Action',
    targetTab: 'cluster-detail',
  },
];

export const DemoWalkthrough: React.FC<DemoWalkthroughProps> = ({
  currentStep,
  isOpen,
  onClose,
  onGoToStep,
}) => {
  if (!isOpen) return null;

  const current = DEMO_STEPS[currentStep - 1] || DEMO_STEPS[0];

  return (
    <div className="fixed bottom-6 left-72 z-40 max-w-md w-full bg-paper-card border border-steel/30 rounded-lg shadow-floating p-4 animate-slideIn">
      <div className="flex items-center justify-between pb-2 border-b border-steel/20 mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-petrol-subtle text-petrol">
            <Sparkles className="w-4 h-4" strokeWidth={1.5} />
          </span>
          <span className="font-display font-semibold text-14 text-ink">
            Official 2-Minute Demo Script
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-steel hover:text-ink p-1 rounded"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-12 font-bold text-petrol uppercase tracking-wider">
            Step {currentStep} of 5
          </span>
          <span className="text-11 text-steel">
            "Flags patterns, not people."
          </span>
        </div>

        <h4 className="font-display font-semibold text-14 text-ink">
          {current.title}
        </h4>
        <p className="text-12 text-steel leading-relaxed">
          {current.desc}
        </p>

        <div className="pt-3 flex items-center justify-between border-t border-steel/15 mt-2">
          <div className="flex gap-1">
            {DEMO_STEPS.map((s) => (
              <button
                key={s.step}
                onClick={() => onGoToStep(s.step)}
                className={`w-6 h-1.5 rounded-full transition-all ${
                  s.step === currentStep ? 'bg-petrol w-8' : 'bg-steel/30'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              if (currentStep < DEMO_STEPS.length) {
                onGoToStep(currentStep + 1);
              } else {
                onGoToStep(1);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-12 font-medium bg-petrol text-white rounded hover:bg-petrol-hover transition-colors"
          >
            <span>{currentStep === 5 ? 'Restart Walkthrough' : 'Next Step'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
