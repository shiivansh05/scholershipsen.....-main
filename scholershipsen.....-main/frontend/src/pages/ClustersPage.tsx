import React, { useState, useMemo } from 'react';
import { Cluster, RiskBand, CaseStatus } from '../types';
import { RiskBandBadge, StatusChip } from '../components/StatusChip';
import { EmptyState } from '../components/EmptyState';
import { DataTable, Column } from '../components/DataTable';
import { AnimatedScore } from '../components/AnimatedScore';
import { Search, Filter, LayoutGrid, List, Sparkles, Layers, FileSpreadsheet, Activity } from 'lucide-react';

interface ClustersPageProps {
  clusters: Cluster[];
  csvClusters: Cluster[];
  onOpenCluster: (clusterId: string) => void;
}

export const ClustersPage: React.FC<ClustersPageProps> = ({
  clusters,
  csvClusters,
  onOpenCluster,
}) => {
  const [activeDataset, setActiveDataset] = useState<'sentinel' | 'csv'>('sentinel');
  const [bandFilter, setBandFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const currentDataset = activeDataset === 'sentinel' ? clusters : csvClusters;

  const filteredClusters = useMemo(() => {
    return currentDataset.filter((c) => {
      // Band filter
      if (bandFilter !== 'all' && c.band.toLowerCase() !== bandFilter.toLowerCase()) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && c.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchId = c.id.toLowerCase().includes(query);
        const matchTitle = c.title.toLowerCase().includes(query);
        const matchPattern = c.pattern.toLowerCase().includes(query);
        const matchStudents = c.students.some(s => s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query));
        if (!matchId && !matchTitle && !matchPattern && !matchStudents) return false;
      }
      return true;
    });
  }, [currentDataset, bandFilter, statusFilter, searchQuery]);

  const totalScoreSum = useMemo(() => {
    return filteredClusters.reduce((sum, c) => sum + (c.score || 0), 0);
  }, [filteredClusters]);

  const avgScore = useMemo(() => {
    return filteredClusters.length > 0 ? (totalScoreSum / filteredClusters.length).toFixed(1) : '0';
  }, [filteredClusters, totalScoreSum]);

  const highRiskScoreSum = useMemo(() => {
    return filteredClusters
      .filter((c) => c.band.toLowerCase() === 'high')
      .reduce((sum, c) => sum + (c.score || 0), 0);
  }, [filteredClusters]);

  const reviewScoreSum = useMemo(() => {
    return filteredClusters
      .filter((c) => c.band.toLowerCase() === 'review')
      .reduce((sum, c) => sum + (c.score || 0), 0);
  }, [filteredClusters]);

  const columns: Column<Cluster>[] = [
    {
      key: 'id',
      header: 'Cluster ID',
      sortable: true,
      width: '120px',
      render: (row) => (
        <span className="font-display font-bold text-14 text-ink flex items-center gap-1.5">
          {row.id}
          {row.id === 'CL-104' && (
            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-signal text-white">
              HERO
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'score',
      header: 'Risk Score',
      sortable: true,
      width: '110px',
      render: (row) => (
        <div className="flex items-center gap-1.5 font-display font-bold text-14 tabular-nums">
          <span className={row.score >= 70 ? 'text-signal' : row.score >= 40 ? 'text-amber-dark' : 'text-sea'}>
            {row.score}
          </span>
          <span className="text-11 text-steel font-normal">/100</span>
        </div>
      ),
    },
    {
      key: 'band',
      header: 'Risk Band',
      width: '130px',
      render: (row) => <RiskBandBadge band={row.band} />,
    },
    {
      key: 'title',
      header: 'Pattern Title & Description',
      render: (row) => (
        <div>
          <div className="font-medium text-ink line-clamp-1">{row.title}</div>
          <div className="text-12 text-steel line-clamp-1">{row.pattern}</div>
        </div>
      ),
    },
    {
      key: 'students',
      header: 'Linked Students',
      align: 'right',
      sortable: true,
      width: '120px',
      render: (row) => <span>{row.counts.students}</span>,
    },
    {
      key: 'institutions',
      header: 'Institutions',
      align: 'right',
      sortable: true,
      width: '110px',
      render: (row) => <span>{row.counts.institutions}</span>,
    },
    {
      key: 'status',
      header: 'Case Status',
      width: '130px',
      render: (row) => <StatusChip status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-steel/20 pb-4">
        <div>
          <h1 className="font-display font-bold text-28 text-ink tracking-tight">
            Anomaly Cluster Explorer
          </h1>
          <p className="text-14 text-steel mt-0.5">
            Surfacing explainable relationship rings across applications, accounts, and contact networks.
          </p>
        </div>

        {/* Dataset Switcher (Sentinel 10k vs Live students.csv) */}
        <div className="flex items-center gap-2 bg-paper p-1 rounded-lg border border-steel/25">
          <button
            onClick={() => setActiveDataset('sentinel')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-12 font-semibold transition-colors ${
              activeDataset === 'sentinel'
                ? 'bg-petrol text-white shadow-sm'
                : 'text-steel-dark hover:text-ink'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>National Sentinel Dataset (10,000 Apps)</span>
          </button>

          <button
            onClick={() => setActiveDataset('csv')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-12 font-semibold transition-colors ${
              activeDataset === 'csv'
                ? 'bg-petrol text-white shadow-sm'
                : 'text-steel-dark hover:text-ink'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Uploaded students.csv (Live Graph)</span>
          </button>
        </div>
      </div>

      {/* Risk Score Summary Banner: Actual Sum of Risk Scores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-lg bg-paper-card border border-steel/20 shadow-panel">
        <div>
          <span className="text-11 uppercase font-semibold text-steel block">Active Clusters</span>
          <div className="font-display font-bold text-24 text-ink tabular-nums mt-0.5">
            <AnimatedScore value={filteredClusters.length} />
          </div>
          <span className="text-[11px] text-steel">In current filter</span>
        </div>

        <div className="border-l border-steel/20 pl-3">
          <span className="text-11 uppercase font-semibold text-petrol font-bold block flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-petrol inline shrink-0" />
            Actual Sum of Risk Scores
          </span>
          <div className="font-display font-bold text-24 text-petrol tabular-nums mt-0.5 flex items-baseline gap-1">
            <AnimatedScore value={totalScoreSum} />
            <span className="text-12 font-normal text-steel">pts</span>
          </div>
          <span className="text-[11px] text-steel">Average: <strong className="text-ink">{avgScore}</strong> / 100</span>
        </div>

        <div className="border-l border-steel/20 pl-3">
          <span className="text-11 uppercase font-semibold text-signal-dark block">High-Risk Score Sum</span>
          <div className="font-display font-bold text-24 text-signal tabular-nums mt-0.5 flex items-baseline gap-1">
            <AnimatedScore value={highRiskScoreSum} />
            <span className="text-12 font-normal text-steel">pts</span>
          </div>
          <span className="text-[11px] text-steel">Score &ge; 70 priority mass</span>
        </div>

        <div className="border-l border-steel/20 pl-3">
          <span className="text-11 uppercase font-semibold text-amber-dark block">Review Queue Score Sum</span>
          <div className="font-display font-bold text-24 text-amber-dark tabular-nums mt-0.5 flex items-baseline gap-1">
            <AnimatedScore value={reviewScoreSum} />
            <span className="text-12 font-normal text-steel">pts</span>
          </div>
          <span className="text-[11px] text-steel">Score 40–69 review mass</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-lg bg-paper-card border border-steel/20 shadow-panel flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-steel absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Cluster ID, student name, or pattern..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-14 bg-white border border-steel/40 rounded focus:outline-none focus:border-petrol text-ink placeholder:text-steel/60 font-sans"
          />
        </div>

        {/* Filters & View Modes */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Risk Band Select */}
          <div className="flex items-center gap-1.5 text-12 text-steel">
            <Filter className="w-3.5 h-3.5 text-petrol" />
            <span>Band:</span>
            <select
              value={bandFilter}
              onChange={(e) => setBandFilter(e.target.value)}
              className="px-2.5 py-1.5 text-12 font-medium bg-white border border-steel/40 rounded focus:outline-none focus:border-petrol text-ink"
            >
              <option value="all">All bands</option>
              <option value="high">High risk (70–100)</option>
              <option value="review">Review required (40–69)</option>
              <option value="normal">Normal (&lt; 40)</option>
            </select>
          </div>

          {/* Status Select */}
          <div className="flex items-center gap-1.5 text-12 text-steel">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-12 font-medium bg-white border border-steel/40 rounded focus:outline-none focus:border-petrol text-ink"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="documents_requested">Documents requested</option>
              <option value="escalated">Escalated</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Grid vs Table Toggle */}
          <div className="flex items-center border border-steel/30 rounded overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-petrol text-white' : 'bg-white text-steel hover:text-ink'}`}
              title="Card grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 ${viewMode === 'table' ? 'bg-petrol text-white' : 'bg-white text-steel hover:text-ink'}`}
              title="Dense table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cluster Content */}
      {filteredClusters.length === 0 ? (
        <EmptyState
          message="No clusters match these filters. Clear filters to see all."
          onAction={() => {
            setBandFilter('all');
            setStatusFilter('all');
            setSearchQuery('');
          }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClusters.map((cluster) => {
            const isHero = cluster.id === 'CL-104';
            return (
              <div
                key={cluster.id}
                onClick={() => onOpenCluster(cluster.id)}
                className={`p-5 rounded-lg border transition-all cursor-pointer card-tilt flex flex-col justify-between ${
                  isHero
                    ? 'bg-paper-card border-signal/40 shadow-elevated ring-1 ring-signal/30'
                    : 'bg-paper border-steel/20 hover:border-petrol/40 hover:bg-paper-card shadow-panel'
                }`}
              >
                <div>
                  {/* Top Row: ID, Badges & Score */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-20 text-ink">
                        {cluster.id}
                      </span>
                      {isHero && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-signal text-white">
                          DEMO HERO
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="flex items-baseline gap-1 font-display font-bold text-20 tabular-nums">
                        <span className={cluster.score >= 70 ? 'text-signal' : cluster.score >= 40 ? 'text-amber-dark' : 'text-sea'}>
                          {cluster.score}
                        </span>
                        <span className="text-11 text-steel font-normal">/100</span>
                      </div>
                      <span className="text-[10px] text-steel italic">
                        {cluster.band === 'high' ? 'High risk' : cluster.band === 'review' ? 'Review required' : 'Normal'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <RiskBandBadge band={cluster.band} />
                    <StatusChip status={cluster.status} />
                  </div>

                  <h3 className="font-display font-semibold text-16 text-ink mt-2 line-clamp-1">
                    {cluster.title}
                  </h3>

                  <p className="text-12 text-steel mt-1 line-clamp-2 leading-relaxed">
                    {cluster.pattern}
                  </p>

                  {/* Signals List Preview */}
                  <div className="mt-3.5 space-y-1.5 border-t border-steel/15 pt-3">
                    <div className="text-[11px] font-semibold text-steel uppercase tracking-wider mb-1">
                      Identified Signals
                    </div>
                    {cluster.reasons.slice(0, 3).map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between text-12">
                        <span className="text-ink truncate max-w-[200px]">{r.label}</span>
                        <span className="font-semibold text-petrol tabular-nums">+{r.points}</span>
                      </div>
                    ))}
                    {cluster.reasons.length > 3 && (
                      <div className="text-[11px] text-steel italic">
                        +{cluster.reasons.length - 3} additional signal{cluster.reasons.length - 3 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Metadata counts */}
                <div className="mt-4 pt-3 border-t border-steel/15 flex items-center justify-between text-11 text-steel">
                  <div className="flex items-center gap-3">
                    <span><strong>{cluster.counts.students}</strong> Students</span>
                    <span>•</span>
                    <span><strong>{cluster.counts.institutions}</strong> Institutions</span>
                    <span>•</span>
                    <span><strong>{cluster.counts.banks}</strong> Bank</span>
                  </div>

                  <span className="text-petrol font-semibold inline-flex items-center group-hover:underline">
                    Inspect &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredClusters}
          keyField="id"
          onRowClick={(row) => onOpenCluster(row.id)}
        />
      )}
    </div>
  );
};
