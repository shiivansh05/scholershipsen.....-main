import React, { useState, useEffect } from 'react';
import { api } from './lib/api';
import { SummaryData, Cluster, Institution, ActionPayload } from './types';
import { OverviewPage } from './pages/OverviewPage';
import { ClustersPage } from './pages/ClustersPage';
import { ClusterDetailPage } from './pages/ClusterDetailPage';
import { InstitutionsPage } from './pages/InstitutionsPage';
import { CasesPage } from './pages/CasesPage';
import { ScanPage } from './pages/ScanPage';
import { ProfilePage } from './pages/ProfilePage';
import { Toast, ToastMessage } from './components/Toast';
import {
  LayoutDashboard,
  GitFork,
  Building2,
  Briefcase,
  Shield,
  FileUp,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true); // Open on load
  const [selectedClusterId, setSelectedClusterId] = useState<string>('CL-104');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [csvClusters, setCsvClusters] = useState<Cluster[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load Initial Data via typed api layer
  useEffect(() => {
    async function loadData() {
      const [sum, cls, ccls, inst] = await Promise.all([
        api.getSummary(),
        api.getClusters(),
        api.getCsvClusters(),
        api.getInstitutions(),
      ]);
      setSummary(sum);
      setClusters(cls);
      setCsvClusters(ccls);
      setInstitutions(inst);
    }
    loadData();
  }, []);

  const addToast = (type: 'success' | 'alert', title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleOpenCluster = (clusterId: string) => {
    setSelectedClusterId(clusterId);
    setActiveTab('cluster-detail');
  };

  const handleTakeAction = async (clusterId: string, payload: ActionPayload) => {
    const res = await api.takeAction(clusterId, payload);
    if (res.success) {
      const updated = await api.getClusters();
      const updatedCsv = await api.getCsvClusters();
      setClusters(updated);
      setCsvClusters(updatedCsv);

      const actionLabels: Record<string, string> = {
        verify: 'Records verified',
        assign: `Investigator assigned: ${payload.assignee || 'Officer on duty'}`,
        request_documents: 'Documents requested from institution',
        escalate: 'Case escalated to Anti-Corruption Desk',
        close: 'Case closed and filed in audit archive',
      };

      addToast(
        payload.action === 'escalate' ? 'alert' : 'success',
        actionLabels[payload.action] || 'Action recorded',
        payload.note
      );
    }
  };

const handleClusterInjected = (newCluster: Cluster) => {
    setClusters((prev) => [newCluster, ...prev]);
    addToast(
      'alert',
      `Red Team Pattern Injected: ${newCluster.id}`,
      `Simulated adversarial ring detected and rendered in live graph (Score: ${newCluster.score}/100)`
    );
  };

  // Current cluster for detail view
  const currentCluster =
    clusters.find((c) => c.id.toLowerCase() === selectedClusterId.toLowerCase()) ||
    csvClusters.find((c) => c.id.toLowerCase() === selectedClusterId.toLowerCase()) ||
    clusters[0];

  return (
    <div className="flex min-h-screen bg-mist text-ink font-sans selection:bg-petrol-subtle selection:text-petrol">
      {/* 1. Left Rail (Harbor) - Physical rail aesthetic with opening & closing toggle */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-16'
        } bg-harbor border-r border-harbor-border shadow-elevated flex flex-col justify-between shrink-0 z-30 sticky top-0 h-screen select-none harbor-scroll transition-all duration-300 ease-in-out`}
      >
        <div>
          {/* Brand & Crest / Toggle Controller */}
          <div className={`border-b border-harbor-border/80 ${isSidebarOpen ? 'p-5' : 'p-3 flex flex-col items-center gap-2'}`}>
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                  className="w-9 h-9 rounded bg-petrol flex items-center justify-center text-paper border border-petrol-light shadow-sm shrink-0 cursor-pointer hover:scale-105 transition-transform"
                  title={isSidebarOpen ? 'Click to collapse sidebar' : 'Click to expand sidebar'}
                >
                  <Shield className="w-5 h-5 text-paper" strokeWidth={1.8} />
                </div>
                {isSidebarOpen && (
                  <div className="min-w-0">
                    <h1 className="font-display font-bold text-16 text-white tracking-tight leading-none truncate">
                      Scholarship Sentinel
                    </h1>
                    <p className="text-[11px] text-steel-light mt-1 font-medium tracking-wide uppercase truncate">
                      Anomaly Intelligence
                    </p>
                  </div>
                )}
              </div>

              {/* Explicit Toggle Button in Header */}
              {isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded text-steel-light hover:text-white hover:bg-harbor-surface transition-colors shrink-0"
                  title="Close navigation sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}
            </div>

            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1 rounded text-steel-light hover:text-white hover:bg-harbor-surface transition-colors"
                title="Open navigation sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Items (Sections from SCHOLARSHIP_SENTINEL_FINAL.md Section 7.5) */}
          <nav className="p-2 space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center ${
                isSidebarOpen ? 'gap-3 px-3.5' : 'justify-center px-2'
              } py-2 rounded text-13 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-petrol text-white shadow-sm font-semibold'
                  : 'text-steel-light hover:text-white hover:bg-harbor-surface'
              }`}
              title="Overview"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              {isSidebarOpen && <span>Overview</span>}
            </button>

            <button
              onClick={() => setActiveTab('clusters')}
              className={`w-full flex items-center ${
                isSidebarOpen ? 'justify-between px-3.5' : 'justify-center px-2'
              } py-2 rounded text-13 font-medium transition-colors ${
                activeTab === 'clusters' || activeTab === 'cluster-detail'
                  ? 'bg-petrol text-white shadow-sm font-semibold'
                  : 'text-steel-light hover:text-white hover:bg-harbor-surface'
              }`}
              title="Clusters"
            >
              <div className="flex items-center gap-3">
                <GitFork className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                {isSidebarOpen && <span>Clusters</span>}
              </div>
              {isSidebarOpen && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-signal/30 text-signal font-bold">
                  {clusters.length}
                </span>
              )}
            </button>

            {/* Dedicated Scan Custom CSV / Excel Section */}
            <button
              onClick={() => setActiveTab('scan')}
              className={`w-full flex items-center ${
                isSidebarOpen ? 'justify-between px-3.5' : 'justify-center px-2'
              } py-2 rounded text-13 font-medium transition-colors ${
                activeTab === 'scan'
                  ? 'bg-petrol text-white shadow-sm font-semibold'
                  : 'text-steel-light hover:text-white hover:bg-harbor-surface'
              }`}
              title="Scan Custom File"
            >
              <div className="flex items-center gap-3">
                <FileUp className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                {isSidebarOpen && <span>Scan Custom File</span>}
              </div>
              {isSidebarOpen && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber/30 text-amber font-bold">
                  NEW
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('institutions')}
              className={`w-full flex items-center ${
                isSidebarOpen ? 'justify-between px-3.5' : 'justify-center px-2'
              } py-2 rounded text-13 font-medium transition-colors ${
                activeTab === 'institutions'
                  ? 'bg-petrol text-white shadow-sm font-semibold'
                  : 'text-steel-light hover:text-white hover:bg-harbor-surface'
              }`}
              title="Institutions"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                {isSidebarOpen && <span>Institutions</span>}
              </div>
              {isSidebarOpen && (
                <span className="text-[11px] text-steel-light tabular-nums">
                  {institutions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('cases')}
              className={`w-full flex items-center ${
                isSidebarOpen ? 'justify-between px-3.5' : 'justify-center px-2'
              } py-2 rounded text-13 font-medium transition-colors ${
                activeTab === 'cases'
                  ? 'bg-petrol text-white shadow-sm font-semibold'
                  : 'text-steel-light hover:text-white hover:bg-harbor-surface'
              }`}
              title="Cases"
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                {isSidebarOpen && <span>Cases</span>}
              </div>
              {isSidebarOpen && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-steel/20 text-steel-light tabular-nums">
                  {clusters.filter((c) => c.status !== 'closed').length}
                </span>
              )}
            </button>

            {/* Officer Profile Tab */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center ${
                isSidebarOpen ? 'justify-between px-3.5' : 'justify-center px-2'
              } py-2 rounded text-13 font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-petrol text-white shadow-sm font-semibold'
                  : 'text-steel-light hover:text-white hover:bg-harbor-surface'
              }`}
              title="Officer Profile & Audit Authority"
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                {isSidebarOpen && <span>Officer Profile</span>}
              </div>
              {isSidebarOpen && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sea/20 text-sea font-bold">
                  IAS
                </span>
              )}
            </button>
          </nav>

          {/* Quick Hero Access (when open) */}
          {isSidebarOpen && (
            <div className="px-3 py-2">
              <button
                onClick={() => handleOpenCluster('CL-104')}
                className={`w-full p-2.5 rounded-lg border text-left transition-all ${
                  activeTab === 'cluster-detail' && selectedClusterId === 'CL-104'
                    ? 'bg-harbor-surface border-signal shadow-sm'
                    : 'bg-harbor-muted border-harbor-border hover:border-steel/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-12 text-white">
                    Priority Ring: CL-104
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-signal text-white">
                    Score 87
                  </span>
                </div>
                <p className="text-[11px] text-steel-light mt-0.5 line-clamp-1">
                  Shared bank BA103 &amp; Mobile
                </p>
              </button>
            </div>
          )}
        </div>

        {/* Rail Footer Controls - User Profile Card (Clicking toggles the sidebar AND opens the profile page) */}
        <div className="p-3 border-t border-harbor-border">
          <button
            onClick={() => {
              setIsSidebarOpen((prev) => !prev);
              setActiveTab('profile');
            }}
            className={`w-full text-left rounded-lg transition-all ${
              activeTab === 'profile'
                ? 'bg-harbor-surface border border-petrol-light'
                : 'hover:bg-harbor-surface/80 border border-transparent'
            } ${isSidebarOpen ? 'p-2' : 'p-1.5 flex justify-center'}`}
            title={
              isSidebarOpen
                ? 'Click profile to close sidebar & open Profile'
                : 'Click profile to open sidebar & open Profile'
            }
          >
            {isSidebarOpen ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-petrol flex items-center justify-center text-white font-bold text-12 shrink-0 border border-petrol-light">
                    RV
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-medium text-12 truncate">Rajesh Verma, IAS</div>
                    <div className="text-[10px] text-steel-light truncate">Principal Audit Officer</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-sea" title="Secure Session Active" />
                  <PanelLeftClose className="w-3.5 h-3.5 text-steel-light hover:text-white" />
                </div>
              </div>
            ) : (
              <div className="relative group flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-petrol flex items-center justify-center text-white font-bold text-12 border border-petrol-light hover:scale-105 transition-transform">
                  RV
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-sea border border-harbor" />
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area on Mist */}
      <main className="flex-1 min-w-0 p-8 max-w-7xl mx-auto">
        {!isSidebarOpen && (
          <div className="mb-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-12 font-semibold rounded bg-paper border border-steel/25 text-ink hover:bg-mist transition-colors shadow-sm"
              title="Open Navigation Sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-petrol" />
              <span>Expand Sidebar</span>
            </button>
          </div>
        )}

        {summary ? (
          <>
            {activeTab === 'overview' && (
              <OverviewPage
                summary={summary}
                topClusters={clusters}
                institutions={institutions}
                onOpenCluster={handleOpenCluster}
                onNavigateTab={(tab) => {
                  if (tab === 'cluster-detail') {
                    setSelectedClusterId('CL-104');
                  }
                  setActiveTab(tab);
                }}
                onClusterInjected={handleClusterInjected}
              />
            )}

            {activeTab === 'clusters' && (
              <ClustersPage
                clusters={clusters}
                csvClusters={csvClusters}
                onOpenCluster={handleOpenCluster}
              />
            )}

            {activeTab === 'cluster-detail' && currentCluster && (
              <ClusterDetailPage
                cluster={currentCluster}
                onBack={() => setActiveTab('clusters')}
                onTakeAction={(payload) => handleTakeAction(currentCluster.id, payload)}
              />
            )}

            {activeTab === 'scan' && (
              <ScanPage
                onOpenCluster={handleOpenCluster}
                onClusterScanned={(scannedClusters) => {
                  setClusters((prev) => [...scannedClusters, ...prev]);
                }}
              />
            )}

            {activeTab === 'institutions' && (
              <InstitutionsPage
                institutions={institutions}
                onSelectInstitution={() => {}}
              />
            )}

            {activeTab === 'cases' && (
              <CasesPage
                clusters={clusters}
                onOpenCluster={handleOpenCluster}
                onTakeAction={handleTakeAction}
              />
            )}

            {activeTab === 'profile' && (
              <ProfilePage
                summary={summary}
                clusters={clusters}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
                onNavigateTab={(tab) => {
                  if (tab === 'cluster-detail') {
                    setSelectedClusterId('CL-104');
                  }
                  setActiveTab(tab);
                }}
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-2 border-petrol border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="font-display font-semibold text-16 text-ink">
                Loading Sentinel Intelligence Graph...
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Toast Notification Stack */}
      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}

export default App;
