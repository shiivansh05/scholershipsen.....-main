import React, { useState, useMemo } from 'react';
import { Cluster, ActionType, ActionPayload } from '../types';
import { StatusChip, RiskBandBadge } from '../components/StatusChip';
import { ActionModal } from '../components/ActionModal';
import { AnimatedScore } from '../components/AnimatedScore';
import { UserCheck, FileText, ShieldAlert, CheckCircle2, Archive, Search, Filter, Layers, Activity } from 'lucide-react';

interface CasesPageProps {
  clusters: Cluster[];
  onOpenCluster: (clusterId: string) => void;
  onTakeAction: (clusterId: string, payload: ActionPayload) => void;
}

const STATUS_COLUMNS = [
  { id: 'open', title: 'Open Queue', subtitle: 'Awaiting officer triage', countColor: 'bg-mist text-ink' },
  { id: 'assigned', title: 'Assigned', subtitle: 'Field inspector allocated', countColor: 'bg-petrol-subtle text-petrol' },
  { id: 'documents_requested', title: 'Documents Requested', subtitle: 'Requisition notice issued', countColor: 'bg-amber-subtle text-amber-dark' },
  { id: 'escalated', title: 'Escalated', subtitle: 'Sent to Anti-Corruption Desk', countColor: 'bg-signal-subtle text-signal-dark font-bold' },
  { id: 'closed', title: 'Closed / Concluded', subtitle: 'Review complete', countColor: 'bg-sea-subtle text-sea-dark' },
];

export const CasesPage: React.FC<CasesPageProps> = ({
  clusters,
  onOpenCluster,
  onTakeAction,
}) => {
  const [bandFilter, setBandFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalClusterId, setModalClusterId] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<ActionType | null>(null);

  const filtered = useMemo(() => {
    return clusters.filter((c) => {
      if (bandFilter !== 'all' && c.band.toLowerCase() !== bandFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!c.id.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [clusters, bandFilter, searchQuery]);

  const totalCaseRiskScoreSum = useMemo(() => {
    return filtered.reduce((acc, c) => acc + (c.score || 0), 0);
  }, [filtered]);

  const avgCaseRiskScore = useMemo(() => {
    return filtered.length > 0 ? (totalCaseRiskScoreSum / filtered.length).toFixed(1) : '0';
  }, [filtered, totalCaseRiskScoreSum]);

  const handleOpenAction = (clusterId: string, action: ActionType, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalClusterId(clusterId);
    setModalAction(action);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-steel/20 pb-4">
        <div>
          <h1 className="font-display font-bold text-28 text-ink tracking-tight">
            Case Management &amp; Officer Workflow
          </h1>
          <p className="text-14 text-steel mt-0.5">
            Audit-tracked queue for verifying, assigning, and escalating flagged scholarship clusters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded bg-paper-card border border-steel/20 shadow-sm text-right">
            <span className="text-[10px] text-steel uppercase font-semibold block tracking-wider flex items-center gap-1 justify-end">
              <Activity className="w-3 h-3 text-petrol inline" />
              Actual Sum of Case Risk Scores
            </span>
            <div className="font-display font-bold text-18 text-petrol tabular-nums leading-tight flex items-baseline gap-1 justify-end">
              <AnimatedScore value={totalCaseRiskScoreSum} />
              <span className="text-11 text-steel font-normal">pts</span>
            </div>
            <span className="text-[10px] text-steel">Avg: {avgCaseRiskScore} / 100</span>
          </div>

          <div className="text-right">
            <span className="text-12 text-steel block">
              Active Cases: <strong className="text-ink font-semibold"><AnimatedScore value={filtered.length} /></strong>
            </span>
            <span className="text-[11px] text-steel">Across all queues</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-lg bg-paper-card border border-steel/20 shadow-panel flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-steel absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search cases by ID or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-14 bg-white border border-steel/40 rounded focus:outline-none focus:border-petrol text-ink font-sans"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-12 text-steel">
            <Filter className="w-3.5 h-3.5 text-petrol" />
            <span>Risk Band:</span>
            <select
              value={bandFilter}
              onChange={(e) => setBandFilter(e.target.value)}
              className="px-2.5 py-1.5 text-12 font-medium bg-white border border-steel/40 rounded focus:outline-none focus:border-petrol text-ink"
            >
              <option value="all">All Bands</option>
              <option value="high">High Risk (70–100)</option>
              <option value="review">Review Required (40–69)</option>
              <option value="normal">Normal (&lt; 40)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban / Status-Grouped Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {STATUS_COLUMNS.map((col) => {
          const colClusters = filtered.filter(
            (c) => c.status.toLowerCase() === col.id.toLowerCase() ||
            (col.id === 'closed' && c.status.toLowerCase() === 'verified')
          );
          const colRiskSum = colClusters.reduce((sum, c) => sum + (c.score || 0), 0);

          return (
            <div
              key={col.id}
              className="p-3.5 rounded-lg bg-paper border border-steel/20 shadow-panel flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="pb-3 border-b border-steel/15 mb-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-14 text-ink">
                    {col.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-11 font-bold ${col.countColor}`}
                  >
                    {colClusters.length}
                  </span>
                </div>
                <div className="text-[11px] text-steel mt-0.5">
                  {col.subtitle}
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-steel/10 text-[11px]">
                  <span className="text-steel font-medium">Actual Risk Sum:</span>
                  <span className="font-display font-bold text-ink tabular-nums flex items-baseline gap-0.5">
                    <AnimatedScore value={colRiskSum} />
                    <span className="text-[10px] text-steel font-normal">pts</span>
                  </span>
                </div>
              </div>

              {/* Cards in Column */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {colClusters.length === 0 ? (
                  <div className="text-center py-10 text-12 text-steel/60 italic">
                    No cases in this status
                  </div>
                ) : (
                  colClusters.map((cluster) => {
                    const isHero = cluster.id === 'CL-104';
                    return (
                      <div
                        key={cluster.id}
                        onClick={() => onOpenCluster(cluster.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer card-tilt bg-paper-card ${
                          isHero
                            ? 'border-signal/50 ring-1 ring-signal/20'
                            : 'border-steel/20 hover:border-petrol/40 hover:bg-mist-light'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-display font-bold text-14 text-ink">
                            {cluster.id}
                          </span>
                          <span
                            className={`font-display font-bold text-12 tabular-nums ${
                              cluster.score >= 70
                                ? 'text-signal'
                                : cluster.score >= 40
                                ? 'text-amber-dark'
                                : 'text-sea'
                            }`}
                          >
                            {cluster.score}/100
                          </span>
                        </div>

                        <h4 className="font-medium text-12 text-ink line-clamp-1">
                          {cluster.title}
                        </h4>

                        <div className="mt-2 flex items-center justify-between text-[11px] text-steel">
                          <span>{cluster.counts.students} Students</span>
                          <span>{cluster.counts.institutions} Inst</span>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="mt-3 pt-2 border-t border-steel/15 flex items-center justify-between gap-1">
                          {col.id === 'open' && (
                            <button
                              onClick={(e) => handleOpenAction(cluster.id, 'assign', e)}
                              className="text-[11px] font-semibold text-petrol hover:underline flex items-center gap-1"
                            >
                              <UserCheck className="w-3 h-3" /> Assign
                            </button>
                          )}

                          {col.id === 'assigned' && (
                            <button
                              onClick={(e) => handleOpenAction(cluster.id, 'request_documents', e)}
                              className="text-[11px] font-semibold text-petrol hover:underline flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" /> Requisition
                            </button>
                          )}

                          {col.id !== 'escalated' && col.id !== 'closed' && (
                            <button
                              onClick={(e) => handleOpenAction(cluster.id, 'escalate', e)}
                              className="text-[11px] font-semibold text-signal hover:underline flex items-center gap-1 ml-auto"
                            >
                              <ShieldAlert className="w-3 h-3" /> Escalate
                            </button>
                          )}

                          {col.id !== 'closed' && (
                            <button
                              onClick={(e) => handleOpenAction(cluster.id, 'close', e)}
                              className="text-[11px] font-medium text-steel hover:text-ink"
                            >
                              Close
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Dialog Modal */}
      {modalClusterId && modalAction && (
        <ActionModal
          isOpen={true}
          clusterId={modalClusterId}
          actionType={modalAction}
          onClose={() => {
            setModalClusterId(null);
            setModalAction(null);
          }}
          onSubmit={(payload) => {
            onTakeAction(modalClusterId, payload);
            setModalClusterId(null);
            setModalAction(null);
          }}
        />
      )}
    </div>
  );
};
