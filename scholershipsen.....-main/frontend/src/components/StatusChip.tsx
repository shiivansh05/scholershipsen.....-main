import React from 'react';
import { CaseStatus, RiskBand } from '../types';

export const StatusChip: React.FC<{ status: CaseStatus | string }> = ({ status }) => {
  const norm = status.toLowerCase();

  const getStyle = () => {
    switch (norm) {
      case 'open':
        return 'bg-mist-light text-ink border-steel/40';
      case 'assigned':
        return 'bg-petrol-subtle text-petrol border-petrol/30';
      case 'documents_requested':
        return 'bg-amber-subtle text-amber-dark border-amber/30';
      case 'escalated':
        return 'bg-signal-subtle text-signal-dark border-signal/30 font-semibold';
      case 'closed':
      case 'verified':
        return 'bg-sea-subtle text-sea-dark border-sea/30';
      default:
        return 'bg-mist text-steel border-steel/30';
    }
  };

  const formatText = () => {
    switch (norm) {
      case 'documents_requested':
        return 'Documents requested';
      case 'open':
        return 'Open';
      case 'assigned':
        return 'Assigned';
      case 'escalated':
        return 'Escalated';
      case 'closed':
        return 'Closed';
      case 'verified':
        return 'Verified';
      default:
        return norm.replace('_', ' ');
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-12 font-medium border ${getStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75" />
      {formatText()}
    </span>
  );
};

export const RiskBandBadge: React.FC<{ band: RiskBand | string }> = ({ band }) => {
  const norm = band.toLowerCase();

  switch (norm) {
    case 'high':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-signal-subtle text-signal-dark border border-signal/20 font-medium text-12">
          <span className="w-2 h-2 rounded-full bg-signal" />
          High risk
        </span>
      );
    case 'review':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-subtle text-amber-dark border border-amber/20 font-medium text-12">
          <span className="w-2 h-2 rounded-full bg-amber" />
          Review required
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sea-subtle text-sea-dark border border-sea/20 font-medium text-12">
          <span className="w-2 h-2 rounded-full bg-sea" />
          Normal
        </span>
      );
  }
};
