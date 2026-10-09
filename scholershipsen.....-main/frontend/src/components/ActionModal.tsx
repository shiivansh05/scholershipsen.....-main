import React, { useState } from 'react';
import { ActionType, ActionPayload } from '../types';
import { X, ShieldAlert, UserCheck, FileText, CheckCircle2, Archive } from 'lucide-react';

interface ActionModalProps {
  isOpen: boolean;
  clusterId: string;
  actionType: ActionType | null;
  onClose: () => void;
  onSubmit: (payload: ActionPayload) => void;
}

const INVESTIGATORS = [
  'Vikram Sethi (Sr. Zonal Officer)',
  'Priya Sharma (Field Inspector, Zone 1)',
  'Dr. Rajesh Verma (Nodal Officer)',
  'Ananya Roy (Forensic Audit Specialist)',
  'K. S. Murthy (District Inspectorate)',
];

export const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  clusterId,
  actionType,
  onClose,
  onSubmit,
}) => {
  const [note, setNote] = useState('');
  const [assignee, setAssignee] = useState(INVESTIGATORS[0]);

  if (!isOpen || !actionType) return null;

  const getActionConfig = () => {
    switch (actionType) {
      case 'verify':
        return {
          title: `Verify records for ${clusterId}`,
          description: 'Confirm initial field findings or mark verified records before proceeding.',
          buttonText: 'Verify records',
          buttonClass: 'bg-petrol text-white hover:bg-petrol-hover',
          icon: <CheckCircle2 className="w-5 h-5 text-sea" strokeWidth={1.5} />,
          defaultNote: 'Initial documents and attendance registers cross-verified with district database.',
        };
      case 'assign':
        return {
          title: `Assign investigator for ${clusterId}`,
          description: 'Delegate physical verification and biometric audit to an inspector.',
          buttonText: 'Assign investigator',
          buttonClass: 'bg-petrol text-white hover:bg-petrol-hover',
          icon: <UserCheck className="w-5 h-5 text-petrol" strokeWidth={1.5} />,
          defaultNote: 'Assigned for immediate on-site inspection of student enrollment and account linkage.',
        };
      case 'request_documents':
        return {
          title: `Request documents for ${clusterId}`,
          description: 'Issue formal requisition for original admission records, bank passbooks, and certificates.',
          buttonText: 'Request documents',
          buttonClass: 'bg-petrol text-white hover:bg-petrol-hover',
          icon: <FileText className="w-5 h-5 text-amber" strokeWidth={1.5} />,
          defaultNote: 'Requisition issued for verified bank branch mandate forms and admission entry logs.',
        };
      case 'escalate':
        return {
          title: `Escalate ${clusterId} to Anti-Corruption Desk`,
          description: 'Formal escalation for syndicate pattern detection across multiple institutions.',
          buttonText: 'Escalate case',
          buttonClass: 'bg-signal text-white hover:bg-signal-dark',
          icon: <ShieldAlert className="w-5 h-5 text-signal" strokeWidth={1.5} />,
          defaultNote: 'Escalated to State Audit & Anti-Corruption Bureau due to multi-hub convergence.',
        };
      case 'close':
        return {
          title: `Close case ${clusterId}`,
          description: 'Conclude investigation. State conclusion notes for permanent audit records.',
          buttonText: 'Close case',
          buttonClass: 'bg-steel-dark text-white hover:bg-ink',
          icon: <Archive className="w-5 h-5 text-steel" strokeWidth={1.5} />,
          defaultNote: 'Case review completed. Identified anomalies resolved or documented under authorized exemption.',
        };
    }
  };

  const config = getActionConfig();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      action: actionType,
      note: note.trim() || config.defaultNote,
      assignee: actionType === 'assign' ? assignee : undefined,
    });
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-paper border border-steel/20 rounded-lg shadow-floating max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-steel/20 bg-paper-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-mist">{config.icon}</div>
            <div>
              <h3 className="font-display font-semibold text-16 text-ink">
                {config.title}
              </h3>
              <p className="text-12 text-steel">{config.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-steel hover:text-ink hover:bg-mist transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {actionType === 'assign' && (
            <div>
              <label className="block text-12 font-semibold text-ink uppercase tracking-wider mb-1.5">
                Assignee Officer
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3 py-2 text-14 bg-white border border-steel/40 rounded focus:outline-none focus:border-petrol text-ink"
              >
                {INVESTIGATORS.map((inv) => (
                  <option key={inv} value={inv}>
                    {inv}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-12 font-semibold text-ink uppercase tracking-wider mb-1.5">
              Investigation Note & Mandate
            </label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={config.defaultNote}
              className="w-full px-3 py-2 text-14 bg-white border border-steel/40 rounded focus:outline-none focus:border-petrol text-ink placeholder:text-steel/60 resize-none font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-steel/15">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-14 font-medium text-steel-dark hover:text-ink bg-mist hover:bg-mist-dark rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-14 font-medium rounded transition-colors ${config.buttonClass}`}
            >
              {config.buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
