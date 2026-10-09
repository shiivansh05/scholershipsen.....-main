import React, { useState, useMemo } from 'react';
import { Institution } from '../types';
import { InstitutionBarMap3D } from '../components/InstitutionBarMap3D';
import { DataTable, Column } from '../components/DataTable';
import { AnimatedScore } from '../components/AnimatedScore';
import { Search, Filter, AlertTriangle, Building, ArrowUpRight, ShieldAlert } from 'lucide-react';

interface InstitutionsPageProps {
  institutions: Institution[];
  onSelectInstitution?: (institution: Institution) => void;
}

export const InstitutionsPage: React.FC<InstitutionsPageProps> = ({
  institutions,
  onSelectInstitution,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [surgeFilter, setSurgeFilter] = useState<'all' | 'surge' | 'normal'>('all');
  const [selectedInstId, setSelectedInstId] = useState<string | undefined>(undefined);

  const filteredInstitutions = useMemo(() => {
    return institutions.filter((inst) => {
      if (surgeFilter === 'surge' && inst.surge_ratio < 3.0) return false;
      if (surgeFilter === 'normal' && inst.surge_ratio >= 3.0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = inst.name.toLowerCase().includes(q);
        const matchId = inst.id.toLowerCase().includes(q);
        const matchState = inst.state.toLowerCase().includes(q);
        const matchType = inst.type.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchState && !matchType) return false;
      }
      return true;
    });
  }, [institutions, surgeFilter, searchQuery]);

  const totalInstRiskPoints = useMemo(() => {
    return filteredInstitutions.reduce(
      (acc, i) => acc + (i.surge_ratio >= 3.0 ? 15 : i.surge_ratio >= 1.5 ? 8 : 0),
      0
    );
  }, [filteredInstitutions]);

  const criticalSurgeRiskPoints = useMemo(() => {
    return filteredInstitutions
      .filter((i) => i.surge_ratio >= 3.0)
      .reduce((acc) => acc + 15, 0);
  }, [filteredInstitutions]);

  const avgInstRiskPoints = filteredInstitutions.length
    ? (totalInstRiskPoints / filteredInstitutions.length).toFixed(1)
    : '0';

  const columns: Column<Institution>[] = [
    {
      key: 'id',
      header: 'Institution ID',
      sortable: true,
      width: '120px',
      render: (r) => <span className="font-display font-bold text-ink">{r.id}</span>,
    },
    {
      key: 'name',
      header: 'College / Institute Name',
      sortable: true,
      render: (r) => (
        <div>
          <div className="font-medium text-ink flex items-center gap-2">
            <span>{r.name}</span>
            {r.surge_ratio >= 3.0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-signal text-white">
                SURGE &gt; 3x
              </span>
            )}
          </div>
          <div className="text-11 text-steel">{r.district}, {r.state} • {r.type}</div>
        </div>
      ),
    },
    {
      key: 'registered',
      header: 'Registered',
      sortable: true,
      align: 'right',
      width: '110px',
      render: (r) => <span className="tabular-nums">{r.registered}</span>,
    },
    {
      key: 'active',
      header: 'Active Students',
      sortable: true,
      align: 'right',
      width: '120px',
      render: (r) => <span className="tabular-nums font-medium">{r.active}</span>,
    },
    {
      key: 'applications',
      header: 'Applications',
      sortable: true,
      align: 'right',
      width: '120px',
      render: (r) => <span className="tabular-nums font-semibold text-ink">{r.applications}</span>,
    },
    {
      key: 'surge_ratio',
      header: 'Surge Ratio',
      sortable: true,
      align: 'right',
      width: '120px',
      render: (r) => {
        const isCritical = r.surge_ratio >= 3.0;
        return (
          <span
            className={`font-display font-bold text-14 tabular-nums ${
              isCritical ? 'text-signal' : 'text-sea-dark'
            }`}
          >
            {r.surge_ratio.toFixed(2)}x
          </span>
        );
      },
    },
    {
      key: 'risk_points',
      header: 'Actual Risk Score',
      sortable: true,
      align: 'right',
      width: '140px',
      render: (r) => {
        const points = r.surge_ratio >= 3.0 ? 15 : r.surge_ratio >= 1.5 ? 8 : 0;
        return (
          <div className="text-right">
            <span
              className={`font-display font-bold text-14 tabular-nums ${
                points >= 15 ? 'text-signal' : points > 0 ? 'text-amber-dark' : 'text-sea'
              }`}
            >
              {points > 0 ? `+${points} pts` : '0 pts'}
            </span>
            <div className="text-[10px] text-steel">
              {points === 15 ? 'Ghost Surge (+15)' : points === 8 ? 'Elevated (+8)' : 'Baseline'}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-steel/20 pb-4">
        <div>
          <h1 className="font-display font-bold text-28 text-ink tracking-tight">
            Registered Institutions Directory
          </h1>
          <p className="text-14 text-steel mt-0.5">
            Monitoring application surges relative to active student populations across 60 accredited colleges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-12 font-medium px-3 py-1 bg-signal-subtle text-signal-dark border border-signal/30 rounded">
            {institutions.filter(i => i.surge_ratio >= 3.0).length} Ghost Surge Alerts (&gt;3x)
          </span>
          <span className="text-12 font-bold px-3 py-1 bg-petrol/10 text-petrol border border-petrol/30 rounded tabular-nums flex items-center gap-1">
            <span>Total Risk:</span>
            <AnimatedScore value={totalInstRiskPoints} suffix=" pts" />
          </span>
        </div>
      </div>

      {/* Executive Risk Score Summary Banner */}
      <div className="bg-paper-card border border-steel/20 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-signal/10 border border-signal/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-signal" />
          </div>
          <div>
            <div className="text-11 uppercase font-bold tracking-wider text-steel">
              Campus Anomaly Score Attribution
            </div>
            <div className="font-display font-bold text-20 text-ink flex items-center gap-1.5">
              <span>Actual Sum of Risk Score:</span>
              <AnimatedScore value={totalInstRiskPoints} suffix=" pts" className="text-signal font-bold" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-12 divide-x divide-steel/20 flex-wrap">
          <div>
            <span className="text-steel">Critical Surge Risk Mass (&gt;3x): </span>
            <AnimatedScore value={criticalSurgeRiskPoints} suffix=" pts" className="font-bold text-signal ml-1" />
          </div>
          <div className="pl-4">
            <span className="text-steel">Average Risk per Campus: </span>
            <span className="font-bold text-ink tabular-nums">{avgInstRiskPoints} pts</span>
          </div>
          <div className="pl-4">
            <span className="text-steel">Institutions Evaluated: </span>
            <AnimatedScore value={filteredInstitutions.length} className="font-bold text-petrol ml-1" />
          </div>
        </div>
      </div>

      {/* 3D Isometric Map Embedded */}
      <div className="p-4 rounded-lg bg-paper-card border border-steel/20 shadow-panel space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-18 text-ink">
              3D Volume Extrusion Grid
            </h2>
            <p className="text-12 text-steel">
              Visualizes application ratio per campus. Red bars exceed 3x threshold (+15 anomaly rule).
            </p>
          </div>
          <span className="text-11 text-steel">
            Hover to view capacity • Click bar to highlight
          </span>
        </div>

        <InstitutionBarMap3D
          institutions={filteredInstitutions}
          selectedId={selectedInstId}
          onSelectInstitution={(inst) => {
            setSelectedInstId(inst.id);
            if (onSelectInstitution) onSelectInstitution(inst);
          }}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-lg bg-paper-card border border-steel/20 shadow-panel flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-steel absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by college name, district, or state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-14 bg-white border border-steel/40 rounded focus:outline-none focus:border-petrol text-ink font-sans"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-12 text-steel font-medium">Filter Surge:</span>
          <button
            onClick={() => setSurgeFilter('all')}
            className={`px-3 py-1.5 text-12 font-medium rounded transition-colors ${
              surgeFilter === 'all' ? 'bg-petrol text-white' : 'bg-mist text-steel-dark hover:text-ink'
            }`}
          >
            All 60
          </button>
          <button
            onClick={() => setSurgeFilter('surge')}
            className={`px-3 py-1.5 text-12 font-medium rounded transition-colors ${
              surgeFilter === 'surge' ? 'bg-signal text-white' : 'bg-mist text-steel-dark hover:text-ink'
            }`}
          >
            Surge &gt; 3x ({institutions.filter(i => i.surge_ratio >= 3.0).length})
          </button>
          <button
            onClick={() => setSurgeFilter('normal')}
            className={`px-3 py-1.5 text-12 font-medium rounded transition-colors ${
              surgeFilter === 'normal' ? 'bg-sea text-white' : 'bg-mist text-steel-dark hover:text-ink'
            }`}
          >
            Normal Volume
          </button>
        </div>
      </div>

      {/* Institutions Table */}
      <DataTable
        columns={columns}
        data={filteredInstitutions}
        keyField="id"
        selectedKey={selectedInstId}
        onRowClick={(row) => setSelectedInstId(row.id)}
      />
    </div>
  );
};
