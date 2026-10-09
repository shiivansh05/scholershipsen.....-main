import React, { useState, useEffect } from 'react';
import { Cluster, ActionType, ActionPayload, CounterfactualResult, CaseBrief } from '../types';
import { api } from '../lib/api';
import { RiskMeter } from '../components/RiskMeter';
import { AnimatedScore } from '../components/AnimatedScore';
import { StatusChip, RiskBandBadge } from '../components/StatusChip';
import { GraphStage3D } from '../components/GraphStage3D';
import { ActionModal } from '../components/ActionModal';
import { DataTable, Column } from '../components/DataTable';
import {
  ArrowLeft,
  UserCheck,
  FileText,
  ShieldAlert,
  CheckCircle2,
  Archive,
  Clock,
  Sparkles,
  Building,
  CreditCard,
  Phone,
  FileCheck,
  AlertOctagon,
  Eye,
  Sliders,
  ShieldCheck,
  Printer,
  Download,
  Calendar,
  X,
  Check,
} from 'lucide-react';

interface ClusterDetailPageProps {
  cluster: Cluster;
  onBack: () => void;
  onTakeAction: (payload: ActionPayload) => void;
}

export const ClusterDetailPage: React.FC<ClusterDetailPageProps> = ({
  cluster,
  onBack,
  onTakeAction,
}) => {
  const [activeActionModal, setActiveActionModal] = useState<ActionType | null>(null);

  // Counterfactual state
  const [disabledSignals, setDisabledSignals] = useState<string[]>([]);
  const [counterfactual, setCounterfactual] = useState<CounterfactualResult | null>(null);

  // Time-lapse slider state
  const [timeLapseStep, setTimeLapseStep] = useState<number>(4); // 1 to 4 steps

  // Case Brief Modal state
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);
  const [caseBrief, setCaseBrief] = useState<CaseBrief | null>(null);

  // Cleared Sibling Households
  const [clearedGroups, setClearedGroups] = useState<any[]>([]);

  useEffect(() => {
    async function loadCleared() {
      const data = await api.getClearedGroups();
      setClearedGroups(data);
    }
    loadCleared();
  }, []);

  // Update counterfactual when disabledSignals changes
  useEffect(() => {
    async function updateCounterfactual() {
      const res = await api.getClusterCounterfactual(cluster.id, disabledSignals);
      setCounterfactual(res);
    }
    updateCounterfactual();
  }, [cluster.id, disabledSignals]);

  const toggleSignal = (sig: string) => {
    setDisabledSignals((prev) =>
      prev.includes(sig) ? prev.filter((s) => s !== sig) : [...prev, sig]
    );
  };

  const handleOpenCaseBrief = async () => {
    const brief = await api.getClusterCaseBrief(cluster.id);
    setCaseBrief(brief);
    setIsBriefModalOpen(true);
  };

  const currentScore = counterfactual ? counterfactual.new_score : cluster.score;
  const currentBand = counterfactual ? counterfactual.new_band : cluster.band;

  const activeReasons = cluster.reasons.filter((r) => !disabledSignals.includes(r.signal));
  const actualPointsSum = activeReasons.reduce((acc, r) => acc + (r.points || 0), 0);
  const pointsFormula = activeReasons.map((r) => `+${r.points}`).join(' ');

  // Filter graph for time-lapse
  const timeLapseFilteredGraph = React.useMemo(() => {
    if (timeLapseStep >= 4) return cluster.graph;
    // Step 1: student nodes only
    // Step 2: bank node added
    // Step 3: mobile node added
    // Step 4: full graph
    const allowedNodeCount = Math.max(2, Math.floor((cluster.graph.nodes.length * timeLapseStep) / 4));
    const activeNodes = cluster.graph.nodes.slice(0, allowedNodeCount);
    const activeIds = new Set(activeNodes.map((n) => n.id));
    const activeEdges = cluster.graph.edges.filter(
      (e) => activeIds.has(e.source) && activeIds.has(e.target)
    );
    return { nodes: activeNodes, edges: activeEdges };
  }, [cluster.graph, timeLapseStep]);

  const studentColumns: Column<any>[] = [
    {
      key: 'id',
      header: 'Student ID',
      sortable: true,
      width: '100px',
      render: (r) => <span className="font-bold font-display text-ink">{r.id}</span>,
    },
    {
      key: 'name',
      header: 'Applicant Name',
      sortable: true,
      render: (r) => (
        <div>
          <div className="font-medium text-ink">{r.name}</div>
          <div className="text-11 text-steel">{r.course} • {r.year}</div>
        </div>
      ),
    },
    {
      key: 'institution',
      header: 'Enrolled Institution',
      sortable: true,
      render: (r) => <span className="text-ink text-12 font-medium">{r.institution}</span>,
    },
    {
      key: 'attendance',
      header: 'Attendance %',
      sortable: true,
      align: 'right',
      width: '120px',
      render: (r) => {
        const isCritical = r.attendance < 30;
        return (
          <span
            className={`font-semibold tabular-nums ${
              isCritical ? 'text-signal font-bold' : 'text-ink'
            }`}
          >
            {r.attendance}%
          </span>
        );
      },
    },
    {
      key: 'bank_masked',
      header: 'Bank Account (Masked)',
      render: (r) => (
        <span className="font-mono text-12 bg-mist px-2 py-0.5 rounded text-ink">
          {r.bank_masked}
        </span>
      ),
    },
    {
      key: 'mobile_masked',
      header: 'Mobile Contact',
      render: (r) => (
        <span className="font-mono text-12 text-steel-dark">
          {r.mobile_masked}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Claim Amount',
      sortable: true,
      align: 'right',
      render: (r) => (
        <span className="font-medium tabular-nums text-ink">
          ₹{r.amount.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between border-b border-steel/20 pb-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-14 font-semibold text-petrol hover:text-petrol-hover transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          <span>Back to clusters list</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCaseBrief}
            className="flex items-center gap-1.5 px-3 py-1.5 text-12 font-semibold rounded bg-paper border border-steel/30 text-petrol hover:bg-mist transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Auto Case Brief</span>
          </button>
          <span className="text-12 text-steel">•</span>
          <span className="text-12 text-steel">
            Unit of Output: <strong className="text-ink font-semibold">Cluster #{cluster.id}</strong>
          </span>
        </div>
      </div>

      {/* Cluster Header Toolbar */}
      <div className="p-6 rounded-lg bg-paper-card border border-steel/20 shadow-panel flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display font-bold text-28 text-ink tracking-tight flex items-center gap-2">
              {cluster.id}
            </h1>
            {cluster.is_hero && (
              <span className="px-2 py-0.5 rounded text-11 font-bold bg-signal text-white">
                DEMO HERO (CL-104)
              </span>
            )}
            <StatusChip status={cluster.status} />
            <RiskBandBadge band={currentBand} />
            {disabledSignals.length > 0 && (
              <span className="px-2 py-0.5 rounded text-11 font-semibold bg-amber/20 text-amber-dark border border-amber/30">
                Counterfactual Simulation Active
              </span>
            )}
          </div>

          <h2 className="font-display font-semibold text-16 text-ink">
            {cluster.title}
          </h2>
          <p className="text-12 text-steel max-w-2xl leading-relaxed">
            {cluster.pattern}
          </p>
        </div>

        {/* Risk Meter Gauge & Actual Sum of Risk Score */}
        <div className="lg:border-l lg:border-steel/20 lg:pl-6 shrink-0 flex flex-col items-center">
          <RiskMeter score={currentScore} band={currentBand} size="lg" />
          <div className="mt-2.5 px-3 py-1.5 rounded bg-mist/60 border border-steel/20 text-center w-full">
            <span className="text-[10px] text-steel uppercase font-semibold block tracking-wider">
              Actual Sum of Risk Score
            </span>
            <div className="font-display font-bold text-16 text-ink tabular-nums flex items-baseline justify-center gap-1">
              <AnimatedScore value={actualPointsSum} />
              <span className="text-11 text-steel font-normal">pts</span>
              {actualPointsSum > 100 && (
                <span className="text-[10px] text-signal font-semibold">(Capped to 100)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Officer Action Bar */}
      <div className="p-4 rounded-lg bg-paper border border-steel/20 shadow-panel flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-12 font-semibold uppercase tracking-wider text-steel">
            Officer Actions:
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setActiveActionModal('assign')}
            className="flex items-center gap-2 px-4 py-2 text-12 font-semibold rounded bg-petrol text-white hover:bg-petrol-hover transition-colors shadow-sm"
          >
            <UserCheck className="w-4 h-4" strokeWidth={1.5} />
            <span>Assign investigator</span>
          </button>

          <button
            onClick={() => setActiveActionModal('request_documents')}
            className="flex items-center gap-2 px-4 py-2 text-12 font-semibold rounded bg-petrol text-white hover:bg-petrol-hover transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" strokeWidth={1.5} />
            <span>Request documents</span>
          </button>

          <button
            onClick={() => setActiveActionModal('verify')}
            className="flex items-center gap-2 px-3.5 py-2 text-12 font-semibold rounded bg-sea-subtle text-sea-dark hover:bg-sea-subtle/80 border border-sea/30 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-sea" strokeWidth={1.5} />
            <span>Verify records</span>
          </button>

          <button
            onClick={() => setActiveActionModal('escalate')}
            className="flex items-center gap-2 px-3.5 py-2 text-12 font-semibold rounded bg-signal-subtle text-signal-dark hover:bg-signal-subtle/80 border border-signal/40 transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-signal" strokeWidth={1.5} />
            <span>Escalate case</span>
          </button>

          <button
            onClick={() => setActiveActionModal('close')}
            className="flex items-center gap-1.5 px-3 py-2 text-12 font-medium text-steel hover:text-ink bg-mist hover:bg-mist-dark rounded transition-colors"
          >
            <Archive className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Close case</span>
          </button>
        </div>
      </div>

      {/* Hero Layout: 3D Graph Stage (60%) + Why Flagged Panel & Counterfactuals (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 60%: 3D Graph Stage & Time-lapse Slider */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-16 text-ink">
                3D Entity Relationship Topology
              </h3>
              <p className="text-12 text-steel">
                Drag to orbit, scroll to zoom. Node geometry: spheres (students), octahedrons (banks), cubes (mobiles).
              </p>
            </div>
            <span className="text-11 text-steel">
              {timeLapseFilteredGraph.nodes.length} Nodes • {timeLapseFilteredGraph.edges.length} Relationships
            </span>
          </div>

          <GraphStage3D graph={timeLapseFilteredGraph} clusterId={cluster.id} />

          {/* Tier B Feature 7: Cluster Time-Lapse Replay Slider */}
          <div className="p-4 rounded-lg bg-paper border border-steel/20 shadow-panel space-y-2">
            <div className="flex items-center justify-between text-12">
              <span className="font-display font-semibold text-ink flex items-center gap-2">
                <Clock className="w-4 h-4 text-petrol" />
                Cluster Emergence Time-Lapse Replay
              </span>
              <span className="text-11 text-steel">
                Lead Time: <strong>18 Days Prior to Disbursement</strong>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={timeLapseStep}
                onChange={(e) => setTimeLapseStep(Number(e.target.value))}
                className="w-full h-2 bg-mist rounded-lg appearance-none cursor-pointer accent-petrol"
              />
              <span className="text-12 font-mono font-bold text-ink min-w-[70px] text-right">
                Phase {timeLapseStep}/4
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-steel">
              <span>Day 1: Initial filing</span>
              <span>Day 6: Bank linkage</span>
              <span>Day 12: Mobile linkage</span>
              <span>Day 18: Score 87 (Held)</span>
            </div>
          </div>
        </div>

        {/* Right 40%: Why This Was Flagged & Counterfactual Toggles */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div>
            <h3 className="font-display font-bold text-16 text-ink">
              Why this was flagged
            </h3>
            <p className="text-12 text-steel">
              Every flag explains the exact signals and points. Toggle any signal to simulate counterfactuals.
            </p>
          </div>

          {/* Reasons & Interactive Counterfactual Toggles */}
          <div className="p-4 rounded-lg bg-paper-card border border-steel/20 shadow-panel space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-steel/20">
              <span className="text-11 font-semibold uppercase tracking-wider text-steel">
                Signal Rule (Click to Toggle)
              </span>
              <span className="text-11 font-semibold uppercase tracking-wider text-steel">
                Points
              </span>
            </div>

            <div className="space-y-2.5">
              {cluster.reasons.map((reason, idx) => {
                const isDisabled = disabledSignals.includes(reason.signal);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleSignal(reason.signal)}
                    className={`p-3 rounded border transition-all cursor-pointer select-none ${
                      isDisabled
                        ? 'bg-mist/40 border-steel/20 opacity-60 line-through'
                        : 'bg-paper border-steel/20 hover:border-petrol/50 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!isDisabled}
                          onChange={() => {}}
                          className="rounded text-petrol focus:ring-petrol cursor-pointer"
                        />
                        <span className="font-display font-semibold text-13 text-ink">
                          {reason.label}
                        </span>
                      </div>
                      <span
                        className={`font-display font-bold text-13 tabular-nums ${
                          isDisabled ? 'text-steel' : 'text-signal'
                        }`}
                      >
                        +{reason.points} pts
                      </span>
                    </div>
                    <p className="text-11 text-steel mt-1 leading-snug pl-5">
                      {reason.text}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Counterfactual Impact Banner */}
            {disabledSignals.length > 0 && counterfactual && (
              <div className="p-3 rounded bg-amber/15 border border-amber/30 text-12 text-ink space-y-1 animate-fadeIn">
                <div className="font-semibold text-amber-dark flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Counterfactual Result:
                </div>
                <div className="leading-snug text-11 text-steel-dark">
                  {counterfactual.explanation}
                </div>
              </div>
            )}

            {/* Tally Score Bar with Actual Points Sum */}
            <div className="pt-3 border-t border-steel/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-display font-bold text-14 text-ink block">
                    Actual Sum of Risk Score:
                  </span>
                  <span className="text-[11px] text-steel tabular-nums font-medium">
                    {pointsFormula} = <strong className="text-ink">{actualPointsSum} pts</strong>
                  </span>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1 font-display font-bold text-22 text-signal tabular-nums justify-end">
                    <span>{currentScore}</span>
                    <span className="text-12 text-steel font-normal">/ 100</span>
                  </div>
                  <span className="text-[10px] text-steel">Capped Score</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-mist text-11 text-steel italic border-l-2 border-petrol leading-relaxed">
              Score reflects unusual signals, not the chance of fraud. 87/100 means several unusual signals together, not "87% fraud".
            </div>
          </div>

          {/* Tier A Feature 2: Seen But Not Flagged Panel */}
          <div className="p-4 rounded-lg bg-paper-card border border-sea/30 shadow-panel space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sea" />
              <h4 className="font-display font-bold text-14 text-ink">
                Seen But Not Flagged (Family Shield)
              </h4>
            </div>
            <p className="text-11 text-steel leading-relaxed">
              Nearby contact links verified as authentic sibling households with identical parent records. Cleared without penalty:
            </p>

            <div className="space-y-1.5 text-11">
              {clearedGroups.slice(0, 2).map((g) => (
                <div key={g.id} className="p-2 rounded bg-paper border border-steel/15">
                  <strong className="text-ink">{g.student_names.join(' & ')}</strong> (Parents: {g.parents})
                  <div className="text-[10px] text-sea font-medium mt-0.5">&bull; {g.cleared_reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Linked Student Applications Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-18 text-ink">
              Linked Student Applications ({cluster.students.length})
            </h3>
            <p className="text-12 text-steel">
              Identifiers masked according to privacy guidelines. Raw values encrypted in privacy vault.
            </p>
          </div>
          <span className="text-11 text-steel font-medium px-2.5 py-1 bg-mist rounded border border-steel/20">
            HMAC Pseudonymized
          </span>
        </div>

        <DataTable
          columns={studentColumns}
          data={cluster.students}
          keyField="id"
        />
      </div>

      {/* Case Timeline & Officer History */}
      <div className="p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-petrol" strokeWidth={1.5} />
          <h3 className="font-display font-semibold text-16 text-ink">
            Timeline of Case Actions &amp; Audit Log
          </h3>
        </div>

        <div className="space-y-3">
          {cluster.timeline.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded bg-paper border border-steel/15 text-12"
            >
              <div className="w-2 h-2 rounded-full bg-petrol mt-1.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">
                    {item.action}
                  </span>
                  <span className="text-11 text-steel tabular-nums">
                    {item.time}
                  </span>
                </div>
                <p className="text-ink mt-0.5">
                  {item.note}
                </p>
                <div className="text-[11px] text-steel mt-1">
                  Officer: <strong className="text-steel-dark">{item.officer}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Dialog Modal */}
      <ActionModal
        isOpen={activeActionModal !== null}
        clusterId={cluster.id}
        actionType={activeActionModal}
        onClose={() => setActiveActionModal(null)}
        onSubmit={(payload) => {
          onTakeAction(payload);
          setActiveActionModal(null);
        }}
      />

      {/* Tier B Feature 9: Auto Case Brief Modal */}
      {isBriefModalOpen && caseBrief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-paper-card rounded-xl border border-steel/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-steel/20 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-petrol" />
                <h3 className="font-display font-bold text-18 text-ink">
                  Executive Investigation Brief: {caseBrief.cluster_id}
                </h3>
              </div>
              <button
                onClick={() => setIsBriefModalOpen(false)}
                className="text-steel hover:text-ink p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-12">
              <div className="p-3.5 rounded bg-mist border border-steel/20 flex items-center justify-between">
                <div>
                  <div className="font-bold text-ink text-14">{caseBrief.title}</div>
                  <div className="text-steel mt-0.5">{caseBrief.pattern}</div>
                </div>
                <div className="text-right">
                  <span className="font-display font-bold text-20 text-signal tabular-nums">
                    {caseBrief.score}/100
                  </span>
                  <div className="text-[10px] uppercase font-bold text-signal">
                    {caseBrief.band} Risk
                  </div>
                </div>
              </div>

              <div>
                <strong className="text-ink font-semibold uppercase text-11 tracking-wider block mb-2">
                  Evidence Points Tally:
                </strong>
                <div className="space-y-1.5">
                  {caseBrief.reasons.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-paper border border-steel/15">
                      <span className="text-ink">{r.label} - {r.text}</span>
                      <span className="font-bold text-signal tabular-nums">+{r.points}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <strong className="text-ink font-semibold uppercase text-11 tracking-wider block mb-2">
                  Field Verification Checklist:
                </strong>
                <div className="space-y-1.5">
                  {caseBrief.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded bg-paper border border-steel/15">
                      <input type="checkbox" className="mt-0.5 rounded text-petrol cursor-pointer" />
                      <span className="text-ink">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded bg-amber/15 border border-amber/30 text-amber-dark">
                <strong>Officer Recommendation:</strong> {caseBrief.recommendation}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-steel/20">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-12 font-semibold rounded bg-paper border border-steel/30 text-ink hover:bg-mist transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Case Brief</span>
              </button>
              <button
                onClick={() => setIsBriefModalOpen(false)}
                className="px-4 py-2 text-12 font-semibold rounded bg-petrol text-white hover:bg-petrol-hover transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
