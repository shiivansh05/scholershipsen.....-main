import React, { useState } from 'react';
import { SummaryData, Cluster, Institution } from '../types';
import { api } from '../lib/api';
import { InstitutionBarMap3D } from '../components/InstitutionBarMap3D';
import { RiskBandBadge } from '../components/StatusChip';
import { AnimatedScore } from '../components/AnimatedScore';
import {
  ShieldAlert,
  Users,
  School,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  Layers,
  ChevronRight,
  Zap,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Sliders,
  X,
  Sparkles,
  Activity,
} from 'lucide-react';

interface OverviewPageProps {
  summary: SummaryData;
  topClusters: Cluster[];
  institutions: Institution[];
  onOpenCluster: (clusterId: string) => void;
  onNavigateTab: (tab: string) => void;
  onClusterInjected?: (newCluster: Cluster) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  summary,
  topClusters,
  institutions,
  onOpenCluster,
  onNavigateTab,
  onClusterInjected,
}) => {
  // Red Team Modal State
  const [isRedTeamOpen, setIsRedTeamOpen] = useState(false);
  const [redTeamPattern, setRedTeamPattern] = useState<'shared_bank' | 'mobile_farm' | 'ghost_institution' | 'evasive_ring'>('shared_bank');
  const [redTeamSize, setRedTeamSize] = useState<number>(5);
  const [isInjecting, setIsInjecting] = useState(false);

  // Pre-Disbursement Check Modal State
  const [isPreCheckOpen, setIsPreCheckOpen] = useState(false);
  const [preCheckData, setPreCheckData] = useState({
    Student_ID: 'NEW-APP-2026',
    Student_Name: 'Rahul Verma',
    Aadhaar_No: '593974214828',
    Account_No: '0684041000001517',
    attendance: 78,
  });
  const [preCheckResult, setPreCheckResult] = useState<any | null>(null);

  const handleInjectRedTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInjecting(true);
    try {
      const injected = await api.injectRedTeam(redTeamPattern, redTeamSize);
      if (onClusterInjected) onClusterInjected(injected);
      setIsRedTeamOpen(false);
      onOpenCluster(injected.id);
    } finally {
      setIsInjecting(false);
    }
  };

  const handleRunPreCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.checkApplicationPreDisbursement(preCheckData);
    setPreCheckResult(res);
  };

  // Actual Sum of Risk Scores across detected anomaly clusters
  const totalClusterRiskScoreSum = topClusters.reduce((acc, c) => acc + (c.score || 0), 0);
  const avgClusterRiskScore = topClusters.length > 0 ? (totalClusterRiskScoreSum / topClusters.length).toFixed(1) : '0';

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Title & Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-steel/20 pb-4">
        <div>
          <h1 className="font-display font-bold text-28 text-ink tracking-tight">
            National Scholarship Intelligence Overview
          </h1>
          <p className="text-14 text-steel mt-0.5">
            Graph relationship monitoring across student records, institutions, and disbursement rails.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Pre-Disbursement Check Button */}
          <button
            onClick={() => setIsPreCheckOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-paper border border-steel/30 text-ink text-12 font-medium hover:bg-mist transition-colors shadow-sm"
          >
            <FileCheck className="w-4 h-4 text-petrol" />
            <span>Pre-Disbursement Check</span>
          </button>

          {/* Red Team Live Simulation Button */}
          <button
            onClick={() => setIsRedTeamOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-petrol text-white text-12 font-semibold hover:bg-petrol-hover transition-colors shadow-sm"
          >
            <Zap className="w-4 h-4 text-amber" />
            <span>Red Team Mode (Live)</span>
          </button>
        </div>
      </div>

      {/* Headline Numbers: 5 cards including Actual Sum of Risk Score */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Applications Analyzed */}
        <div className="p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel flex flex-col justify-between">
          <div className="flex items-center justify-between text-steel mb-2">
            <span className="text-11 font-semibold uppercase tracking-wider">
              Applications Analyzed
            </span>
            <Users className="w-4 h-4 text-petrol" strokeWidth={1.5} />
          </div>
          <div>
            <div className="font-display font-bold text-36 text-ink tabular-nums leading-none">
              <AnimatedScore value={summary.applications_analyzed} />
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-11 text-steel">
              <span className="w-2 h-2 rounded-full bg-sea inline-block shrink-0" />
              <span><strong className="text-ink font-semibold">{summary.bands.normal.toLocaleString()}</strong> Normal</span>
            </div>
          </div>
        </div>

        {/* 2. Actual Sum of Risk Score */}
        <div className="p-5 rounded-lg bg-paper-card border border-petrol/30 shadow-panel flex flex-col justify-between bg-gradient-to-b from-paper-card to-petrol-subtle/30">
          <div className="flex items-center justify-between text-steel mb-2">
            <span className="text-11 font-semibold uppercase tracking-wider text-petrol font-bold">
              Actual Sum of Risk Score
            </span>
            <Activity className="w-4 h-4 text-petrol" strokeWidth={1.8} />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-36 text-petrol tabular-nums leading-none">
                <AnimatedScore value={totalClusterRiskScoreSum} />
              </span>
              <span className="text-12 font-medium text-steel">pts</span>
            </div>
            <div className="text-11 text-steel mt-3 flex items-center justify-between">
              <span>Avg: <strong className="text-ink">{avgClusterRiskScore}</strong> / 100</span>
              <span className="font-semibold text-petrol">{topClusters.length} clusters</span>
            </div>
          </div>
        </div>

        {/* 3. Disbursement Hold */}
        <div className="p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel flex flex-col justify-between">
          <div className="flex items-center justify-between text-steel mb-2">
            <span className="text-11 font-semibold uppercase tracking-wider text-steel-dark">
              Disbursement Hold
            </span>
            <DollarSign className="w-4 h-4 text-petrol" strokeWidth={1.5} />
          </div>
          <div>
            <div className="font-display font-bold text-36 text-ink tabular-nums leading-none">
              {summary.money_at_risk?.held_formatted || '₹3.12 Cr'}
            </div>
            <div className="text-11 text-steel mt-3 flex items-center justify-between">
              <span>Held pre-payout</span>
              <span className="font-semibold text-ink">₹1.70 Cr Recovery</span>
            </div>
          </div>
        </div>

        {/* 4. Review Required */}
        <div className="p-5 rounded-lg bg-paper-card border border-amber/30 shadow-panel flex flex-col justify-between bg-gradient-to-b from-paper-card to-amber-subtle/20">
          <div className="flex items-center justify-between text-steel mb-2">
            <span className="text-11 font-semibold uppercase tracking-wider text-amber-dark">
              Review Band
            </span>
            <AlertTriangle className="w-4 h-4 text-amber" strokeWidth={1.5} />
          </div>
          <div>
            <div className="font-display font-bold text-36 text-amber-dark tabular-nums leading-none">
              <AnimatedScore value={summary.bands.review} />
            </div>
            <div className="text-11 text-steel mt-3">
              Score 40–69 (Queue)
            </div>
          </div>
        </div>

        {/* 5. High-Risk Applications */}
        <div className="p-5 rounded-lg bg-paper-card border border-signal/30 shadow-panel flex flex-col justify-between bg-gradient-to-b from-paper-card to-signal-subtle/30">
          <div className="flex items-center justify-between text-steel mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-11 font-semibold uppercase tracking-wider text-signal-dark">
                High Risk
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-signal text-white">
                PRIORITY
              </span>
            </div>
            <ShieldAlert className="w-4 h-4 text-signal" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-36 text-signal tabular-nums leading-none">
                <AnimatedScore value={summary.bands.high} />
              </span>
              <span className="text-12 font-medium text-steel">
                in {summary.clusters_count.high_risk} clusters
              </span>
            </div>
            <div className="text-11 text-steel mt-3 flex items-center justify-between">
              <span>Score &ge; 70</span>
              <button
                onClick={() => onNavigateTab('clusters')}
                className="text-petrol font-semibold hover:underline inline-flex items-center text-11"
              >
                Inspect list &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section: 3D Institution Map (60%) + Top Clusters (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Institution Surge Map (60% width = 7/12 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-20 text-ink">
                3D Institution Volume &amp; Surge Topology
              </h2>
              <p className="text-12 text-steel">
                Extruded bars indicate application volume relative to active capacity. Bars &gt; 3x turn signal red.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('institutions')}
              className="text-12 font-semibold text-petrol hover:underline inline-flex items-center gap-1"
            >
              All 60 institutions <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <InstitutionBarMap3D
            institutions={institutions}
            onSelectInstitution={() => onNavigateTab('institutions')}
          />
        </div>

        {/* Top Flagged Clusters List (40% width = 5/12 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-20 text-ink">
                Priority Anomaly Clusters
              </h2>
              <p className="text-12 text-steel">
                Multi-signal convergence scored by explainable rules engine.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('clusters')}
              className="text-12 font-semibold text-petrol hover:underline inline-flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {topClusters.slice(0, 5).map((cluster) => {
              const isHero = cluster.id === 'CL-104';
              return (
                <div
                  key={cluster.id}
                  onClick={() => onOpenCluster(cluster.id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isHero
                      ? 'bg-paper-card border-signal/40 shadow-panel ring-1 ring-signal/20'
                      : cluster.is_redteam
                      ? 'bg-paper-card border-amber/40 shadow-panel ring-1 ring-amber/20'
                      : 'bg-paper border-steel/20 hover:border-petrol/40 hover:bg-paper-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-16 text-ink">
                        {cluster.id}
                      </span>
                      {isHero && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-signal text-white">
                          DEMO HERO
                        </span>
                      )}
                      {cluster.is_redteam && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber text-ink">
                          SIMULATED
                        </span>
                      )}
                      <RiskBandBadge band={cluster.band} />
                    </div>

                    <div className="flex items-center gap-1.5 font-display font-bold text-16 tabular-nums">
                      <span className={cluster.score >= 70 ? 'text-signal' : 'text-amber-dark'}>
                        {cluster.score}
                      </span>
                      <span className="text-11 text-steel font-normal">/100</span>
                    </div>
                  </div>

                  <p className="text-12 text-ink font-medium mt-1 line-clamp-1">
                    {cluster.title}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-steel/15 flex items-center justify-between text-11 text-steel">
                    <div className="flex items-center gap-3">
                      <span><strong>{cluster.counts.students}</strong> Linked students</span>
                      <span>•</span>
                      <span><strong>{cluster.counts.institutions}</strong> Institutions</span>
                    </div>
                    <span className="text-petrol font-semibold inline-flex items-center">
                      Inspect 3D graph &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Officer Activity */}
      <div className="p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-petrol" strokeWidth={1.5} />
            <h3 className="font-display font-semibold text-16 text-ink">
              Recent Officer Case Actions &amp; Timeline
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('cases')}
            className="text-12 text-petrol font-semibold hover:underline"
          >
            Open Case Queue &rarr;
          </button>
        </div>

        <div className="divide-y divide-steel/15">
          {summary.recent_activities.map((item, idx) => (
            <div key={idx} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-12">
              <div className="flex items-start md:items-center gap-3">
                <span className="font-semibold text-petrol min-w-[70px]">
                  {item.action}
                </span>
                <span className="font-medium text-ink bg-mist px-2 py-0.5 rounded text-11">
                  {item.cluster_id}
                </span>
                <span className="text-ink">
                  {item.note}
                </span>
              </div>

              <div className="flex items-center gap-4 text-steel text-11 shrink-0 ml-auto md:ml-0">
                <span>By {item.officer}</span>
                <span>•</span>
                <span className="tabular-nums">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Red Team Live Injection Modal (Tier A Feature 4) */}
      {isRedTeamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-paper-card rounded-xl border border-steel/20 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-steel/20 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber" />
                <h3 className="font-display font-bold text-18 text-ink">
                  Red Team Adversarial Simulator
                </h3>
              </div>
              <button
                onClick={() => setIsRedTeamOpen(false)}
                className="text-steel hover:text-ink p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-12 text-steel leading-relaxed">
              Select an adversarial attack pattern to inject synthetic entities live into the Sentinel graph. Proves system elasticity and explainability.
            </p>

            <form onSubmit={handleInjectRedTeam} className="space-y-4">
              <div>
                <label className="block text-11 font-semibold uppercase text-steel mb-1">
                  Attack Pattern Architecture
                </label>
                <select
                  value={redTeamPattern}
                  onChange={(e: any) => setRedTeamPattern(e.target.value)}
                  className="w-full px-3 py-2 text-12 rounded border border-steel/30 bg-paper text-ink focus:outline-none focus:border-petrol"
                >
                  <option value="shared_bank">Shared Bank Account Ring (Mule Hub - High Risk)</option>
                  <option value="mobile_farm">Mobile Farm Ring (Single SIM Batch - Review Band)</option>
                  <option value="ghost_institution">Ghost Institution Surge (Non-existent campus)</option>
                  <option value="evasive_ring">Evasive Ring (Unique banks/mobiles, shared address/guardian)</option>
                </select>
              </div>

              <div>
                <label className="block text-11 font-semibold uppercase text-steel mb-1">
                  Cohort Scale ({redTeamSize} Synthetic Beneficiaries)
                </label>
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={redTeamSize}
                  onChange={(e) => setRedTeamSize(Number(e.target.value))}
                  className="w-full accent-petrol"
                />
              </div>

              <div className="p-3 rounded bg-mist text-11 text-steel leading-snug">
                {redTeamPattern === 'evasive_ring' &&
                  'The Evasive Ring uses distinct banks and phones but shares a residential address and guardian. It demonstrates how graph edge detection catches subtle fraud vectors.'}
                {redTeamPattern === 'shared_bank' &&
                  'The Shared Bank Ring connects applications across 3 colleges into single account BA709.'}
                {redTeamPattern === 'mobile_farm' &&
                  'The Mobile Farm links applications through a single contact number with sequential filing timing.'}
                {redTeamPattern === 'ghost_institution' &&
                  'The Ghost Institution injects 4x surge volume on zero-attendance applicants.'}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRedTeamOpen(false)}
                  className="px-4 py-2 text-12 font-medium rounded text-steel hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInjecting}
                  className="px-4 py-2 text-12 font-semibold rounded bg-petrol text-white hover:bg-petrol-hover transition-colors shadow-sm inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber" />
                  <span>{isInjecting ? 'Injecting Attack...' : 'Inject into Live Graph'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pre-Disbursement Check Modal (Tier A Feature 6) */}
      {isPreCheckOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-paper-card rounded-xl border border-steel/20 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-steel/20 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-petrol" />
                <h3 className="font-display font-bold text-18 text-ink">
                  Pre-Disbursement Application Verification
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsPreCheckOpen(false);
                  setPreCheckResult(null);
                }}
                className="text-steel hover:text-ink p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-12 text-steel">
              Score a newly submitted application before payment disbursement to prevent wrongful payouts.
            </p>

            <form onSubmit={handleRunPreCheck} className="space-y-3 text-12">
              <div>
                <label className="block text-11 font-semibold uppercase text-steel mb-1">
                  Applicant Name
                </label>
                <input
                  type="text"
                  value={preCheckData.Student_Name}
                  onChange={(e) => setPreCheckData({ ...preCheckData, Student_Name: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-steel/30 bg-paper text-ink"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-11 font-semibold uppercase text-steel mb-1">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    value={preCheckData.Aadhaar_No}
                    onChange={(e) => setPreCheckData({ ...preCheckData, Aadhaar_No: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-steel/30 bg-paper text-ink font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-11 font-semibold uppercase text-steel mb-1">
                    Bank Account No
                  </label>
                  <input
                    type="text"
                    value={preCheckData.Account_No}
                    onChange={(e) => setPreCheckData({ ...preCheckData, Account_No: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-steel/30 bg-paper text-ink font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-11 font-semibold uppercase text-steel mb-1">
                  Verified Attendance Percentage ({preCheckData.attendance}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={preCheckData.attendance}
                  onChange={(e) => setPreCheckData({ ...preCheckData, attendance: Number(e.target.value) })}
                  className="w-full accent-petrol"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-12 font-semibold rounded bg-petrol text-white hover:bg-petrol-hover transition-colors shadow-sm"
              >
                Evaluate Pre-Disbursement Risk
              </button>
            </form>

            {preCheckResult && (
              <div className="p-4 rounded-lg bg-mist border border-steel/20 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">Risk Evaluation:</span>
                  <span className="font-bold font-mono text-16 text-signal">
                    {preCheckResult.score}/100
                  </span>
                </div>
                <div className="font-bold text-13 text-ink">
                  Recommendation: <span className="text-petrol">{preCheckResult.recommendation}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
