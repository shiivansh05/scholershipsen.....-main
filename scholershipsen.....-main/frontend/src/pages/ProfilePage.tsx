import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  KeyRound,
  Lock,
  Clock,
  Activity,
  CheckCircle2,
  FileText,
  Building,
  AlertTriangle,
  Download,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
  BadgeCheck,
  Fingerprint,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';
import { Cluster, SummaryData } from '../types';
import { AnimatedScore } from '../components/AnimatedScore';

interface ProfilePageProps {
  summary?: SummaryData | null;
  clusters?: Cluster[];
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNavigateTab: (tab: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  summary,
  clusters = [],
  isSidebarOpen,
  onToggleSidebar,
  onNavigateTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'credentials' | 'audit' | 'preferences'>('credentials');
  const [sessionCopied, setSessionCopied] = useState(false);

  // Compute officer performance metrics
  const totalClusters = clusters.length;
  const highRiskRings = clusters.filter((c) => c.band === 'high').length;
  const totalRiskScoreSum = clusters.reduce((acc, c) => acc + (c.score || 0), 0);
  const resolvedCases = clusters.filter((c) => c.status === 'closed').length;
  const escalatedCases = clusters.filter((c) => c.status === 'escalated').length;

  const handleCopySessionKey = () => {
    navigator.clipboard?.writeText('GOI-NSP-DSC-8492-SHA256-LIVE');
    setSessionCopied(true);
    setTimeout(() => setSessionCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Header & Sidebar Toggle Bar Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-steel/20 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-28 text-ink tracking-tight">
              Officer Profile &amp; Audit Authority
            </h1>
            <span className="px-2.5 py-0.5 rounded text-11 font-bold bg-petrol text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sea" />
              Verified IAS Session
            </span>
          </div>
          <p className="text-14 text-steel mt-0.5">
            Cryptographic audit credentials, case escalation authority, and security clearance for National Scholarship Sentinel.
          </p>
        </div>

        {/* Sidebar Toggle Controller Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="flex items-center gap-2 px-3.5 py-2 text-12 font-semibold rounded bg-paper border border-steel/30 text-ink hover:bg-mist transition-colors shadow-sm"
            title="Toggle the left navigation sidebar open or closed"
          >
            {isSidebarOpen ? (
              <>
                <PanelLeftClose className="w-4 h-4 text-petrol" />
                <span>Close Sidebar ({isSidebarOpen ? 'Active' : 'Closed'})</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="w-4 h-4 text-sea" />
                <span>Open Sidebar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary Identity Card */}
      <div className="p-6 rounded-lg bg-paper-card border border-steel/20 shadow-panel">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-harbor flex items-center justify-center text-white border-2 border-petrol shadow-md shrink-0">
              <span className="font-display font-bold text-22 text-white">RV</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display font-bold text-22 text-ink">
                  Rajesh Verma, IAS
                </h2>
                <span className="px-2 py-0.5 rounded text-11 font-semibold bg-sea/15 text-sea-dark border border-sea/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-sea" />
                  Active Audit Duty
                </span>
              </div>
              <div className="text-13 text-steel mt-1 font-medium">
                Principal Audit Officer &amp; Joint Director of Vigilance
              </div>
              <div className="text-12 text-steel-dark mt-0.5">
                Ministry of Social Justice &amp; Empowerment • Government of India (AGMUT Batch 2011)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopySessionKey}
              className="px-3.5 py-2 rounded text-12 font-semibold bg-mist/70 hover:bg-mist border border-steel/30 text-ink transition-colors flex items-center gap-1.5"
            >
              <Fingerprint className="w-4 h-4 text-petrol" />
              <span>{sessionCopied ? 'Key Copied!' : 'DSC Token: GOI-8492'}</span>
            </button>
            <button
              onClick={() => onNavigateTab('overview')}
              className="px-3.5 py-2 rounded text-12 font-semibold bg-petrol hover:bg-petrol-hover text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Go to Overview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Officer Operational Impact / Risk Score Mass Intercepted */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-paper-card border border-steel/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-11 text-steel uppercase font-bold tracking-wider">
              Total Risk Score Mass
            </span>
            <Activity className="w-4 h-4 text-signal" />
          </div>
          <div className="font-display font-bold text-26 text-ink tabular-nums mt-1.5 flex items-baseline gap-1">
            <AnimatedScore value={totalRiskScoreSum} />
            <span className="text-14 text-steel font-normal">pts</span>
          </div>
          <p className="text-11 text-steel mt-1">
            Actual aggregate risk under officer review
          </p>
        </div>

        <div className="p-4 rounded-lg bg-paper-card border border-steel/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-11 text-steel uppercase font-bold tracking-wider">
              High-Risk Syndicates
            </span>
            <AlertTriangle className="w-4 h-4 text-signal" />
          </div>
          <div className="font-display font-bold text-26 text-signal tabular-nums mt-1.5 flex items-baseline gap-1">
            <AnimatedScore value={highRiskRings} />
            <span className="text-14 text-steel font-normal">Rings</span>
          </div>
          <p className="text-11 text-steel mt-1">
            Priority collusions flagged (Score &gt; 70)
          </p>
        </div>

        <div className="p-4 rounded-lg bg-paper-card border border-steel/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-11 text-steel uppercase font-bold tracking-wider">
              Cases Escalated
            </span>
            <ShieldCheck className="w-4 h-4 text-petrol" />
          </div>
          <div className="font-display font-bold text-26 text-ink tabular-nums mt-1.5 flex items-baseline gap-1">
            <AnimatedScore value={escalatedCases} />
            <span className="text-14 text-steel font-normal">Escalated</span>
          </div>
          <p className="text-11 text-steel mt-1">
            Transferred to Central Vigilance Desk
          </p>
        </div>

        <div className="p-4 rounded-lg bg-paper-card border border-steel/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-11 text-steel uppercase font-bold tracking-wider">
              Disbursal Safeguards
            </span>
            <BadgeCheck className="w-4 h-4 text-sea" />
          </div>
          <div className="font-display font-bold text-26 text-sea tabular-nums mt-1.5">
            ₹3.84 Cr
          </div>
          <p className="text-11 text-steel mt-1">
            Taxpayer scholarship funds safeguarded
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center border-b border-steel/20 gap-2">
        <button
          onClick={() => setActiveSubTab('credentials')}
          className={`px-4 py-2.5 text-13 font-semibold border-b-2 transition-colors ${
            activeSubTab === 'credentials'
              ? 'border-petrol text-petrol'
              : 'border-transparent text-steel hover:text-ink'
          }`}
        >
          Security &amp; Digital Credentials
        </button>
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2.5 text-13 font-semibold border-b-2 transition-colors ${
            activeSubTab === 'audit'
              ? 'border-petrol text-petrol'
              : 'border-transparent text-steel hover:text-ink'
          }`}
        >
          Investigation Activity Log
        </button>
        <button
          onClick={() => setActiveSubTab('preferences')}
          className={`px-4 py-2.5 text-13 font-semibold border-b-2 transition-colors ${
            activeSubTab === 'preferences'
              ? 'border-petrol text-petrol'
              : 'border-transparent text-steel hover:text-ink'
          }`}
        >
          System Preferences &amp; Workspace
        </button>
      </div>

      {/* Tab 1: Credentials */}
      {activeSubTab === 'credentials' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel space-y-4">
            <div className="flex items-center gap-2.5 text-ink font-display font-bold text-16">
              <KeyRound className="w-5 h-5 text-petrol" />
              <span>Officer Authority &amp; Access Clearance</span>
            </div>
            <div className="space-y-3 text-12">
              <div className="flex justify-between py-2 border-b border-steel/15">
                <span className="text-steel">Government Service ID</span>
                <span className="font-mono font-bold text-ink">GOI-IAS-2011-8492</span>
              </div>
              <div className="flex justify-between py-2 border-b border-steel/15">
                <span className="text-steel">Clearance Level</span>
                <span className="font-semibold text-petrol">Level-3 (National Vigilance Executive)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-steel/15">
                <span className="text-steel">Cryptographic Token</span>
                <span className="font-mono text-ink">e-Pramaan Class-3 USB Token</span>
              </div>
              <div className="flex justify-between py-2 border-b border-steel/15">
                <span className="text-steel">Decryption Capability</span>
                <span className="text-sea font-semibold">Authorized for HMAC Pseudonym Unmask</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-steel">Law Enforcement Referral</span>
                <span className="text-signal font-semibold">Authorized to Issue Formal FIR Orders</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel space-y-4">
            <div className="flex items-center gap-2.5 text-ink font-display font-bold text-16">
              <Lock className="w-5 h-5 text-sea" />
              <span>Active NIC Session Telemetry</span>
            </div>
            <div className="space-y-3 text-12">
              <div className="flex justify-between py-2 border-b border-steel/15">
                <span className="text-steel">Network Connection</span>
                <span className="font-mono text-ink">NICNET Secure Gov Gateway</span>
              </div>
              <div className="flex justify-between py-2 border-b border-steel/15">
                <span className="text-steel">Authenticated IP</span>
                <span className="font-mono text-ink">10.42.18.204 (Subnet 24)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-steel/15">
                <span className="text-steel">Authentication Method</span>
                <span className="text-ink font-semibold">FIDO2 Hardware Key + MFA</span>
              </div>
              <div className="flex justify-between py-2 border-b border-steel/15">
                <span className="text-steel">Session Duration</span>
                <span className="text-steel-dark">08:30 AM IST (Remaining: 7h 45m)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-steel">Audit Vault Hash</span>
                <span className="font-mono text-11 text-steel">SHA256: d8a9...b401</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Activity Log */}
      {activeSubTab === 'audit' && (
        <div className="p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-display font-bold text-16 text-ink">
              Recent Case Decisions &amp; Actions Log
            </div>
            <span className="text-11 text-steel">Immutable cryptographic trail</span>
          </div>

          <div className="space-y-3">
            {[
              {
                time: '10:14 AM Today',
                action: 'Escalated to Vigilance Desk',
                target: 'Cluster CL-104 (Cross-Campus Syndicate)',
                score: '87 pts',
                badge: 'Escalated',
                badgeColor: 'bg-signal text-white',
              },
              {
                time: '09:42 AM Today',
                action: 'Verified Sibling Exemption',
                target: 'Cluster CL-DEC-01 (Family Shield Clear)',
                score: '35 pts',
                badge: 'Verified',
                badgeColor: 'bg-sea text-white',
              },
              {
                time: 'Yesterday, 04:15 PM',
                action: 'Requested Bank Statements',
                target: 'Cluster CL-107 (Ghost Institution Surge)',
                score: '82 pts',
                badge: 'Docs Requested',
                badgeColor: 'bg-amber-dark text-white',
              },
              {
                time: 'Yesterday, 02:00 PM',
                action: 'Freeze Disbursals Recommendation',
                target: 'Goutam Buddha Institute (Surge 4.2x)',
                score: '+15 Surge pts',
                badge: 'Disbursal Hold',
                badgeColor: 'bg-signal text-white',
              },
            ].map((log, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded bg-mist/50 border border-steel/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-13 text-ink">
                      {log.action}
                    </span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${log.badgeColor}`}>
                      {log.badge}
                    </span>
                  </div>
                  <div className="text-12 text-steel mt-0.5">
                    Target: <strong className="text-ink">{log.target}</strong> • Risk Score: <span className="font-mono text-signal">{log.score}</span>
                  </div>
                </div>
                <div className="text-11 text-steel font-mono sm:text-right shrink-0">
                  {log.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Preferences */}
      {activeSubTab === 'preferences' && (
        <div className="p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel space-y-5">
          <div className="font-display font-bold text-16 text-ink">
            Workspace Configuration
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="flex items-center justify-between py-3 border-b border-steel/15">
              <div>
                <div className="font-medium text-13 text-ink">Left Navigation Bar Mode</div>
                <div className="text-11 text-steel">Current state of the toggle sidebar</div>
              </div>
              <button
                onClick={onToggleSidebar}
                className="px-3 py-1.5 text-12 font-semibold rounded bg-petrol text-white hover:bg-petrol-hover transition-colors"
              >
                {isSidebarOpen ? 'Currently Open (Click to Close)' : 'Currently Closed (Click to Open)'}
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-steel/15">
              <div>
                <div className="font-medium text-13 text-ink">High-Risk Real-Time Audio Alert</div>
                <div className="text-11 text-steel">Play discreet chime when score exceeds 80</div>
              </div>
              <span className="px-2.5 py-1 text-11 rounded font-semibold bg-sea/15 text-sea-dark">
                Enabled
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium text-13 text-ink">Default Landing View</div>
                <div className="text-11 text-steel">Preferred start screen on portal load</div>
              </div>
              <select
                className="px-3 py-1 text-12 bg-white border border-steel/30 rounded text-ink focus:outline-none"
                defaultValue="overview"
                onChange={(e) => onNavigateTab(e.target.value)}
              >
                <option value="overview">Executive Overview</option>
                <option value="clusters">Collusion Rings</option>
                <option value="scan">Dataset Scanner</option>
                <option value="institutions">Institutions Directory</option>
                <option value="cases">Case Kanban Board</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
