import React, { useState, useEffect } from 'react';
import { FairnessAudit } from '../types';
import { api } from '../lib/api';
import { ShieldCheck, AlertTriangle, Scale, CheckCircle2, Info } from 'lucide-react';

export const FairnessPage: React.FC = () => {
  const [fairness, setFairness] = useState<FairnessAudit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFairness() {
      setIsLoading(true);
      try {
        const data = await api.getFairnessAudit();
        setFairness(data);
      } finally {
        setIsLoading(false);
      }
    }
    loadFairness();
  }, []);

  if (isLoading || !fairness) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-petrol border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-14 font-medium text-steel">Auditing demographic disparate-impact parity...</div>
        </div>
      </div>
    );
  }

  const isCompliant = fairness.is_compliant;

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-steel/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-28 text-ink tracking-tight">
              Algorithmic Fairness &amp; Demographic Parity Audit
            </h1>
            <span className="px-2 py-0.5 rounded text-11 font-bold bg-petrol text-white uppercase tracking-wider">
              Four-Fifths Rule (EEOC Standard)
            </span>
          </div>
          <p className="text-14 text-steel mt-0.5">
            Audit of anomaly flag rates across constitutional categories and geographic districts to guarantee non-discriminatory detection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-12 font-bold border ${
              isCompliant
                ? 'bg-sea-subtle text-sea-dark border-sea/30'
                : 'bg-signal-subtle text-signal-dark border-signal/40'
            }`}
          >
            {isCompliant ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-sea" />
                <span>Fairness Compliant (Ratio: {fairness.disparate_impact_ratio})</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-signal" />
                <span>Fairness Review Required (Ratio: {fairness.disparate_impact_ratio})</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Disparate Impact Ratio Banner */}
      <div className="p-6 rounded-lg bg-paper-card border border-steel/20 shadow-panel flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-steel">
            <Scale className="w-5 h-5 text-petrol" />
            <span className="text-12 font-semibold uppercase tracking-wider">
              Disparate-Impact Ratio Benchmark
            </span>
          </div>
          <h2 className="font-display font-bold text-24 text-ink">
            {fairness.disparate_impact_ratio} <span className="text-14 font-normal text-steel">(Target: 0.80 – 1.25)</span>
          </h2>
          <p className="text-13 text-steel leading-relaxed">
            {fairness.conclusion} Clusters are constructed strictly from identifier sharing topologies (bank accounts, contact numbers, document template hashes), not demographics.
          </p>
        </div>

        {/* Ratio Gauge Visualizer */}
        <div className="bg-paper p-4 rounded-lg border border-steel/20 min-w-[280px] space-y-2">
          <div className="flex items-center justify-between text-11 text-steel">
            <span>0.00 (Severe Bias)</span>
            <span className="font-semibold text-sea">0.80 - 1.25 (Safe Range)</span>
            <span>2.00</span>
          </div>
          <div className="relative h-3 rounded-full bg-mist overflow-hidden">
            <div className="absolute left-[40%] right-[37.5%] top-0 bottom-0 bg-sea/25 border-x border-sea/50" />
            <div
              className="absolute top-0 bottom-0 w-2.5 rounded-full bg-petrol shadow-sm -translate-x-1/2 transition-all"
              style={{ left: `${Math.min(100, Math.max(0, (fairness.disparate_impact_ratio / 1.5) * 100))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-steel">
            <span>Lowest Rate / Highest Rate</span>
            <strong className="text-ink">Current: {fairness.disparate_impact_ratio}</strong>
          </div>
        </div>
      </div>

      {/* Flag Rates by Category */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-18 text-ink">
              Application Flag Rates by Demographic Category
            </h3>
            <p className="text-12 text-steel">
              Comparison across General, OBC, and SC beneficiary groups.
            </p>
          </div>
          <span className="text-11 text-steel">
            Total analyzed: 10,000 filings
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fairness.categories.map((c) => (
            <div key={c.category} className="p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-18 text-ink">
                  Category: {c.category}
                </span>
                <span className="font-display font-bold text-16 text-petrol tabular-nums">
                  {c.flag_rate_pct}%
                </span>
              </div>

              <div className="space-y-1.5 text-12 text-steel">
                <div className="flex items-center justify-between">
                  <span>Total Applications:</span>
                  <strong className="text-ink tabular-nums">{c.total_applications.toLocaleString()}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Flagged for Review:</span>
                  <strong className="text-ink tabular-nums">{c.flagged_applications.toLocaleString()}</strong>
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-mist overflow-hidden">
                <div
                  className="h-full bg-petrol rounded-full"
                  style={{ width: `${Math.min(100, c.flag_rate_pct * 10)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Flag Rates by District */}
      <div className="p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel space-y-4">
        <div>
          <h3 className="font-display font-bold text-16 text-ink">
            Geographic Flag Rate Distribution by District
          </h3>
          <p className="text-12 text-steel">
            Monitored for regional anomalies or targeted hub activity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-12">
          {fairness.districts.map((d) => (
            <div key={d.district} className="p-3.5 rounded bg-paper border border-steel/15 flex flex-col justify-between">
              <div>
                <div className="font-semibold text-ink">{d.district}</div>
                <div className="text-11 text-steel mt-0.5">{d.total} applications</div>
              </div>
              <div className="mt-3 pt-2 border-t border-steel/15 flex items-center justify-between">
                <span className="text-11 text-steel">{d.flagged} flagged</span>
                <span className="font-bold text-ink tabular-nums">{d.flag_rate_pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Officer Audit Note */}
      <div className="p-4 rounded-lg bg-mist/60 border border-steel/20 flex items-start gap-3 text-12 text-steel">
        <Info className="w-4 h-4 text-petrol shrink-0 mt-0.5" />
        <div>
          <strong className="text-ink font-semibold">Governance Compliance Statement:</strong> The Sentinel system does not use demographic category or district as an input feature for clustering or scoring. Disparate impact is audited continuously as an independent safety rail.
        </div>
      </div>
    </div>
  );
};
