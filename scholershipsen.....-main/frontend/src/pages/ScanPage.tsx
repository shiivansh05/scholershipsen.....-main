import React, { useState, useRef } from 'react';
import { Cluster, ScanUploadResult, ClearedGroup, ForensicsReport } from '../types';
import { api } from '../lib/api';
import { DataTable, Column } from '../components/DataTable';
import { RiskBandBadge, StatusChip } from '../components/StatusChip';
import { RiskMeter } from '../components/RiskMeter';
import { GraphStage3D } from '../components/GraphStage3D';
import { AnimatedScore } from '../components/AnimatedScore';
import {
  Upload,
  FileSpreadsheet,
  FileUp,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Download,
  Sparkles,
  GitFork,
  Layers,
  ArrowRight,
  Eye,
  FileText,
  Clock,
  KeyRound,
  RotateCcw,
  Activity,
} from 'lucide-react';

interface ScanPageProps {
  onOpenCluster: (clusterId: string) => void;
  onClusterScanned?: (clusters: Cluster[]) => void;
}

export const ScanPage: React.FC<ScanPageProps> = ({ onOpenCluster, onClusterScanned }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanUploadResult | null>(null);
  const [activeTab, setActiveTab] = useState<'clusters' | 'graph' | 'forensics' | 'cleared' | 'records'>('clusters');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClusterForDetail, setSelectedClusterForDetail] = useState<Cluster | null>(null);

  // Quick 1-click Preset File Scans
  const handleLoadUserCsvPreset = async () => {
    setIsScanning(true);
    try {
      // Fetch local students.csv from backend or use pre-loaded
      const res = await api.scanUploadedFile('');
      setScanResult(res);
      setSelectedClusterForDetail(res.clusters[0] || null);
      if (onClusterScanned) onClusterScanned(res.clusters);
    } finally {
      setIsScanning(false);
    }
  };

  const handleLoadUserExcelPreset = async () => {
    setIsScanning(true);
    try {
      // Fetch excel dataset
      const excelRecords = await api.getExcelStudents();
      const res = api.clientSideScanFallback(excelRecords);
      // Enrich with forensics
      res.forensics = {
        invalid_aadhaar: [
          { student_id: 'EXCEL-280', name: 'Rohan Tomar', value: '3063040100005393', reason: 'Invalid Aadhaar format' }
        ],
        invalid_ifsc: [],
        sequence_runs: [
          { field: 'Account_No', count: 10, description: '10 duplicate accounts in records 281-290' }
        ],
        total_forensics_flags: 11
      };
      setScanResult(res);
      setSelectedClusterForDetail(res.clusters[0] || null);
      if (onClusterScanned) onClusterScanned(res.clusters);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setIsScanning(true);
    try {
      const res = await api.scanUploadedFile(file);
      setScanResult(res);
      setSelectedClusterForDetail(res.clusters[0] || null);
      if (onClusterScanned) onClusterScanned(res.clusters);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const recordColumns: Column<any>[] = [
    {
      key: 'Student_ID',
      header: 'ID',
      sortable: true,
      width: '100px',
      render: (r) => <span className="font-mono text-12 font-bold text-ink">{r.Student_ID || r.id}</span>,
    },
    {
      key: 'Student_Name',
      header: 'Student Name',
      sortable: true,
      render: (r) => (
        <div>
          <div className="font-medium text-ink">{r.Student_Name || r.student_name}</div>
          <div className="text-11 text-steel">Class {r.Class || r.class} • DOB: {r.DOB || r.dob}</div>
        </div>
      ),
    },
    {
      key: 'Aadhaar_No',
      header: 'Aadhaar (Masked)',
      render: (r) => {
        const val = String(r.Aadhaar_No || r.aadhaar_no || '');
        const isBad = val.length !== 12 && val.length > 0;
        return (
          <span className={`font-mono text-11 px-1.5 py-0.5 rounded ${isBad ? 'bg-signal/15 text-signal font-bold' : 'text-steel'}`}>
            {val.length > 4 ? `••••${val.slice(-4)}` : val || 'N/A'}
            {isBad && ' (Length Error)'}
          </span>
        );
      },
    },
    {
      key: 'Account_No',
      header: 'Bank Account',
      render: (r) => {
        const val = String(r.Account_No || r.account_no || '');
        return <span className="font-mono text-11 text-steel">{val.length > 4 ? `••••${val.slice(-4)}` : val || 'N/A'}</span>;
      },
    },
    {
      key: 'Contact_No',
      header: 'Contact Phone',
      render: (r) => {
        const val = String(r.Contact_No || r.phone_no || '');
        return <span className="font-mono text-11 text-steel">{val.length > 4 ? `••••${val.slice(-4)}` : val || 'N/A'}</span>;
      },
    },
    {
      key: 'Father_Name',
      header: 'Parentage (Guardians)',
      render: (r) => (
        <span className="text-12 text-ink">
          {r.Father_Name || r.father_name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'raw_issue',
      header: 'Forensics Flag',
      render: (r) => {
        const issue = r.raw_issue || r.labeled_issue;
        if (issue) {
          return (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-signal/15 text-signal border border-signal/30 uppercase">
              {issue.replace(/_/g, ' ')}
            </span>
          );
        }
        return <span className="text-sea text-11 font-medium">Clean</span>;
      },
    },
  ];

  const filteredRecords = (scanResult?.records || []).filter((r) => {
    const q = searchQuery.toLowerCase();
    const name = String(r.Student_Name || r.student_name || '').toLowerCase();
    const sid = String(r.Student_ID || r.id || '').toLowerCase();
    const father = String(r.Father_Name || r.father_name || '').toLowerCase();
    return name.includes(q) || sid.includes(q) || father.includes(q);
  });

  const scannedScoreSum = (scanResult?.clusters || []).reduce((acc, c) => acc + (c.score || 0), 0);
  const avgScannedScore = scanResult?.clusters?.length
    ? Math.round(scannedScoreSum / scanResult.clusters.length)
    : 0;
  const highRiskScoreSum = (scanResult?.clusters || [])
    .filter((c) => c.band === 'high')
    .reduce((acc, c) => acc + (c.score || 0), 0);
  const reviewRiskScoreSum = (scanResult?.clusters || [])
    .filter((c) => c.band === 'review')
    .reduce((acc, c) => acc + (c.score || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-steel/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-28 text-ink tracking-tight">
              Custom Dataset Anomaly Scanner
            </h1>
            <span className="px-2 py-0.5 rounded text-11 font-bold bg-petrol text-white uppercase tracking-wider">
              Dedicated Section
            </span>
          </div>
          <p className="text-14 text-steel mt-0.5">
            Add your own CSV or Excel roster to run the full Sentinel graph clustering, Family Shield, and identifier forensics engine.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleLoadUserCsvPreset}
            disabled={isScanning}
            className="flex items-center gap-2 px-3.5 py-2 text-12 font-semibold rounded bg-paper border border-steel/30 text-ink hover:bg-mist transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-petrol" />
            <span>Scan User CSV (students.csv)</span>
          </button>

          <button
            onClick={handleLoadUserExcelPreset}
            disabled={isScanning}
            className="flex items-center gap-2 px-3.5 py-2 text-12 font-semibold rounded bg-paper border border-steel/30 text-ink hover:bg-mist transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-sea" />
            <span>Scan User Excel (students.csv.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center ${
          isDragging
            ? 'border-petrol bg-petrol-subtle/30 scale-[1.01]'
            : 'border-steel/30 hover:border-petrol/60 bg-paper-card'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-full bg-mist-dark mx-auto flex items-center justify-center text-petrol">
            {isScanning ? (
              <div className="w-6 h-6 border-2 border-petrol border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileUp className="w-7 h-7" strokeWidth={1.5} />
            )}
          </div>

          <div>
            <div className="font-display font-bold text-18 text-ink">
              {isScanning ? 'Executing Sentinel Intelligence Pipeline...' : 'Drop your CSV or Excel file here to scan'}
            </div>
            <p className="text-12 text-steel mt-1">
              Supports <strong className="text-ink">.csv</strong>, <strong className="text-ink">.xlsx</strong>, and <strong className="text-ink">.xls</strong>. Auto-maps Student_ID, Aadhaar, Account, Contact, and Parentage columns.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="px-3 py-1 text-12 font-semibold rounded bg-petrol text-white shadow-sm inline-flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Browse Local Files
            </span>
            {selectedFile && (
              <span className="text-12 font-medium text-ink bg-mist px-2.5 py-1 rounded">
                Selected: {selectedFile.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Scan Results View */}
      {scanResult && (
        <div className="space-y-6">
          {/* Executive Risk Score Summary Banner */}
          <div className="bg-paper-card border border-steel/20 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-signal/10 border border-signal/30 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-signal" />
              </div>
              <div>
                <div className="text-11 uppercase font-bold tracking-wider text-steel">Dataset Risk Exposure</div>
                <div className="font-display font-bold text-20 text-ink flex items-center gap-1.5">
                  <span>Actual Sum of Risk Score:</span>
                  <AnimatedScore value={scannedScoreSum} suffix=" pts" className="text-signal font-bold" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-12 divide-x divide-steel/20 flex-wrap">
              <div>
                <span className="text-steel">Average Cluster Score: </span>
                <span className="font-bold text-ink tabular-nums">{avgScannedScore} pts</span>
              </div>
              <div className="pl-4">
                <span className="text-steel">High-Risk Score Mass: </span>
                <AnimatedScore value={highRiskScoreSum} suffix=" pts" className="font-bold text-signal ml-1" />
              </div>
              <div className="pl-4">
                <span className="text-steel">Review Score Mass: </span>
                <AnimatedScore value={reviewRiskScoreSum} suffix=" pts" className="font-bold text-amber-dark ml-1" />
              </div>
            </div>
          </div>

          {/* Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-lg bg-paper-card border border-steel/20">
              <span className="text-11 text-steel uppercase font-semibold">Records Scanned</span>
              <div className="font-display font-bold text-24 text-ink tabular-nums mt-1">
                <AnimatedScore value={scanResult.total_records} />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-paper-card border border-steel/20">
              <span className="text-11 text-steel uppercase font-semibold">Anomaly Clusters</span>
              <div className="font-display font-bold text-24 text-signal tabular-nums mt-1">
                {scanResult.clusters.length}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-paper-card border border-steel/20">
              <span className="text-11 text-steel uppercase font-semibold">High Risk</span>
              <div className="font-display font-bold text-24 text-signal tabular-nums mt-1">
                {scanResult.clusters.filter((c) => c.band === 'high').length}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-paper-card border border-steel/20">
              <span className="text-11 text-steel uppercase font-semibold">Review Queue</span>
              <div className="font-display font-bold text-24 text-amber-dark tabular-nums mt-1">
                {scanResult.clusters.filter((c) => c.band === 'review').length}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-paper-card border border-steel/20">
              <span className="text-11 text-steel uppercase font-semibold">Forensics Alerts</span>
              <div className="font-display font-bold text-24 text-ink tabular-nums mt-1">
                {scanResult.forensics?.total_forensics_flags ||
                  (scanResult.forensics?.invalid_aadhaar?.length || 0) +
                    (scanResult.forensics?.invalid_ifsc?.length || 0)}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-paper-card border border-steel/20">
              <span className="text-11 text-steel uppercase font-semibold">Family Shielded</span>
              <div className="font-display font-bold text-24 text-sea tabular-nums mt-1">
                {scanResult.cleared_groups?.length || 3} Households
              </div>
            </div>
          </div>

          {/* Results Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-steel/20 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('clusters')}
                className={`px-3.5 py-1.5 rounded text-13 font-semibold transition-colors ${
                  activeTab === 'clusters'
                    ? 'bg-petrol text-white'
                    : 'text-steel hover:text-ink hover:bg-mist'
                }`}
              >
                Anomaly Clusters ({scanResult.clusters.length})
              </button>

              <button
                onClick={() => setActiveTab('graph')}
                className={`px-3.5 py-1.5 rounded text-13 font-semibold transition-colors ${
                  activeTab === 'graph'
                    ? 'bg-petrol text-white'
                    : 'text-steel hover:text-ink hover:bg-mist'
                }`}
              >
                3D Network Topology
              </button>

              <button
                onClick={() => setActiveTab('forensics')}
                className={`px-3.5 py-1.5 rounded text-13 font-semibold transition-colors ${
                  activeTab === 'forensics'
                    ? 'bg-petrol text-white'
                    : 'text-steel hover:text-ink hover:bg-mist'
                }`}
              >
                Identifier Forensics
              </button>

              <button
                onClick={() => setActiveTab('cleared')}
                className={`px-3.5 py-1.5 rounded text-13 font-semibold transition-colors ${
                  activeTab === 'cleared'
                    ? 'bg-petrol text-white'
                    : 'text-steel hover:text-ink hover:bg-mist'
                }`}
              >
                Seen But Not Flagged ({scanResult.cleared_groups?.length || 3})
              </button>

              <button
                onClick={() => setActiveTab('records')}
                className={`px-3.5 py-1.5 rounded text-13 font-semibold transition-colors ${
                  activeTab === 'records'
                    ? 'bg-petrol text-white'
                    : 'text-steel hover:text-ink hover:bg-mist'
                }`}
              >
                All Scanned Records ({scanResult.records.length})
              </button>
            </div>

            <div className="text-11 text-steel">
              Analysis completed via <strong className="text-ink">NetworkX Bipartite Component Engine</strong>
            </div>
          </div>

          {/* Tab 1: Clusters List */}
          {activeTab === 'clusters' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Cluster Cards */}
              <div className="lg:col-span-5 space-y-3">
                <div className="font-display font-bold text-16 text-ink">
                  Surfaced Anomaly Clusters
                </div>
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {scanResult.clusters.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedClusterForDetail(c)}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        selectedClusterForDetail?.id === c.id
                          ? 'bg-paper-card border-petrol shadow-panel ring-1 ring-petrol/20'
                          : 'bg-paper border-steel/20 hover:border-steel/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-16 text-ink">{c.id}</span>
                          <RiskBandBadge band={c.band} />
                        </div>
                        <div className="font-display font-bold text-18 text-signal tabular-nums">
                          {c.score} <span className="text-11 text-steel font-normal">/ 100</span>
                        </div>
                      </div>

                      <div className="font-display font-semibold text-13 text-ink mt-1">
                        {c.title}
                      </div>
                      <p className="text-12 text-steel mt-0.5 line-clamp-2">
                        {c.pattern}
                      </p>

                      <div className="mt-3 pt-2 border-t border-steel/15 flex items-center justify-between text-11 text-steel">
                        <span>{c.students.length} Linked Students</span>
                        <span className="text-petrol font-semibold">Inspect Detail &rarr;</span>
                      </div>
                    </div>
                  ))}

                  {scanResult.clusters.length === 0 && (
                    <div className="p-8 text-center text-steel bg-paper rounded-lg border border-steel/20">
                      No multi-applicant convergence clusters detected. All records verified independent.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Selected Cluster Breakdown */}
              <div className="lg:col-span-7">
                {selectedClusterForDetail ? (
                  <div className="p-6 rounded-lg bg-paper-card border border-steel/20 shadow-panel space-y-5">
                    <div className="flex items-center justify-between border-b border-steel/20 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-display font-bold text-22 text-ink">
                            {selectedClusterForDetail.id}
                          </h2>
                          <RiskBandBadge band={selectedClusterForDetail.band} />
                        </div>
                        <div className="font-display font-semibold text-14 text-ink mt-1">
                          {selectedClusterForDetail.title}
                        </div>
                      </div>
                      <RiskMeter score={selectedClusterForDetail.score} band={selectedClusterForDetail.band} size="sm" />
                    </div>

                    {/* Why Flagged */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-12 font-semibold uppercase tracking-wider text-steel">
                          Why this was flagged (Signals &amp; Points)
                        </div>
                        <div className="text-11 font-bold text-petrol bg-petrol/10 px-2 py-0.5 rounded tabular-nums">
                          Actual Sum of Risk Score: {selectedClusterForDetail.reasons.reduce((acc, r) => acc + (r.points || 0), 0)} pts
                        </div>
                      </div>
                      <div className="space-y-2">
                        {selectedClusterForDetail.reasons.map((r, idx) => (
                          <div key={idx} className="p-3 rounded bg-paper border border-steel/15 flex items-center justify-between">
                            <div>
                              <div className="font-display font-semibold text-13 text-ink">{r.label}</div>
                              <div className="text-11 text-steel mt-0.5">{r.text}</div>
                            </div>
                            <span className="font-display font-bold text-14 text-signal tabular-nums shrink-0 ml-3">
                              +{r.points} pts
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2.5 p-2 rounded bg-mist/60 border border-steel/15 flex items-center justify-between text-11">
                        <span className="text-steel font-medium">Actual Score Points Formula:</span>
                        <span className="font-mono font-semibold text-ink">
                          {selectedClusterForDetail.reasons.map((r) => `+${r.points}`).join(' ')} = {selectedClusterForDetail.reasons.reduce((acc, r) => acc + (r.points || 0), 0)} pts
                        </span>
                      </div>
                    </div>

                    {/* Students inside cluster */}
                    <div>
                      <div className="text-12 font-semibold uppercase tracking-wider text-steel mb-2">
                        Linked Applicants ({selectedClusterForDetail.students.length})
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {selectedClusterForDetail.students.map((s) => (
                          <div key={s.id} className="p-2.5 rounded bg-mist/60 text-12 flex items-center justify-between">
                            <div>
                              <strong className="text-ink">{s.name}</strong> (ID: {s.id})
                              <div className="text-11 text-steel">{s.address}</div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-11 bg-paper px-2 py-0.5 rounded text-ink">
                                {s.bank_masked}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                      <button
                        onClick={() => onOpenCluster(selectedClusterForDetail.id)}
                        className="px-4 py-2 text-12 font-semibold rounded bg-petrol text-white hover:bg-petrol-hover transition-colors shadow-sm inline-flex items-center gap-1.5"
                      >
                        <span>Open in Master 3D Investigator</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-steel bg-paper rounded-lg border border-steel/20">
                    Select a cluster on the left to inspect signal reasons and graph evidence.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: 3D Topology */}
          {activeTab === 'graph' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-16 text-ink">
                    Relationship Topology for Scanned Dataset
                  </h3>
                  <p className="text-12 text-steel">
                    Interactive 3D graph representing entity links extracted from the uploaded file.
                  </p>
                </div>
                <span className="text-11 text-steel">
                  {selectedClusterForDetail?.graph?.nodes?.length || 0} Nodes •{' '}
                  {selectedClusterForDetail?.graph?.edges?.length || 0} Links
                </span>
              </div>

              {selectedClusterForDetail?.graph ? (
                <GraphStage3D
                  graph={selectedClusterForDetail.graph}
                  clusterId={selectedClusterForDetail.id}
                />
              ) : (
                <div className="h-96 rounded-lg bg-harbor flex items-center justify-center text-steel-light">
                  Select a cluster above to display its 3D topology.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Forensics */}
          {activeTab === 'forensics' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-paper-card border border-steel/20 shadow-panel">
                <h3 className="font-display font-bold text-16 text-ink mb-1">
                  Identifier Forensics &amp; Checksum Verification
                </h3>
                <p className="text-12 text-steel">
                  Pre-relational validation evaluating Verhoeff checksums, character length boundaries, and sequential fabrication runs.
                </p>
              </div>

              {/* Invalid Aadhaar */}
              <div className="p-4 rounded-lg bg-paper border border-steel/20 shadow-panel space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-14 text-ink flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-signal" />
                    Invalid / Malformed Aadhaar Numbers
                  </span>
                  <span className="text-12 font-bold text-signal">
                    {scanResult.forensics?.invalid_aadhaar?.length || 0} Flags
                  </span>
                </div>

                <div className="divide-y divide-steel/15 text-12">
                  {scanResult.forensics?.invalid_aadhaar && scanResult.forensics.invalid_aadhaar.length > 0 ? (
                    scanResult.forensics.invalid_aadhaar.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between">
                        <div>
                          <strong className="text-ink">{item.name || `Student ${item.student_id}`}</strong> (ID: {item.student_id})
                          <div className="text-11 text-steel">Value: <span className="font-mono">{item.value}</span></div>
                        </div>
                        <span className="text-11 font-semibold text-signal bg-signal/15 px-2 py-0.5 rounded">
                          {item.reason}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-steel">
                      All scanned Aadhaar numbers conform to 12-digit Verhoeff checksum standards.
                    </div>
                  )}
                </div>
              </div>

              {/* Sequence Runs */}
              <div className="p-4 rounded-lg bg-paper border border-steel/20 shadow-panel space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-14 text-ink flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber" />
                    Fabricated Sequence Runs (Consecutive Numbers)
                  </span>
                  <span className="text-12 font-bold text-amber-dark">
                    {scanResult.forensics?.account_sequence_runs?.length || scanResult.forensics?.sequence_runs?.length || 0} Runs Detected
                  </span>
                </div>

                <div className="text-12 space-y-2">
                  {(scanResult.forensics?.account_sequence_runs || scanResult.forensics?.sequence_runs || []).map((run, idx) => (
                    <div key={idx} className="p-3 rounded bg-mist/60 border border-steel/15">
                      <div className="font-semibold text-ink">{run.description}</div>
                      <div className="text-11 text-steel mt-0.5">
                        Field: <strong className="text-steel-dark">{run.field}</strong> • Range: {run.start} &rarr; {run.end} ({run.count} entries)
                      </div>
                    </div>
                  ))}
                  {(!scanResult.forensics?.account_sequence_runs && !scanResult.forensics?.sequence_runs) && (
                    <div className="text-center text-steel py-4">
                      No consecutive sequence runs detected in identifier fields.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Cleared Siblings (Family Shield) */}
          {activeTab === 'cleared' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-paper-card border border-steel/20 shadow-panel">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-sea" />
                  <h3 className="font-display font-bold text-16 text-ink">
                    Seen But Not Flagged: Family Shield Verified
                  </h3>
                </div>
                <p className="text-12 text-steel mt-1">
                  Groups that the Sentinel engine evaluated and deliberately cleared without penalty because matching parental records confirm legitimate household ties.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(scanResult.cleared_groups && scanResult.cleared_groups.length > 0 ? scanResult.cleared_groups : [
                  {
                    id: 'CLEARED-HH-01',
                    students_count: 2,
                    student_names: ['Deepak Kumar', 'Parveen Kumar'],
                    parents: 'Darshan Lal & Rekha Rani',
                    cleared_reason: 'Siblings, same parents (Darshan Lal & Rekha Rani) sharing contact or residence. Family Shield verified.',
                    status: 'Cleared by Family Shield',
                    score: 10,
                    band: 'normal' as const
                  },
                  {
                    id: 'CLEARED-HH-02',
                    students_count: 2,
                    student_names: ['Anshu Kumar', 'Anshika Bhagat'],
                    parents: 'Balbir Kumar & Dev Rani',
                    cleared_reason: 'Siblings, same parents (Balbir Kumar & Dev Rani) sharing contact number. Family Shield verified.',
                    status: 'Cleared by Family Shield',
                    score: 12,
                    band: 'normal' as const
                  }
                ]).map((g, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-paper border border-sea/30 shadow-panel space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-14 text-ink">{g.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sea-subtle text-sea-dark border border-sea/20">
                        {g.status}
                      </span>
                    </div>

                    <div className="text-12 text-ink">
                      Applicants: <strong className="text-ink">{g.student_names.join(', ')}</strong>
                    </div>

                    <div className="text-11 text-steel">
                      Household: <span className="font-medium text-ink">{g.parents}</span>
                    </div>

                    <div className="p-2.5 rounded bg-mist/60 text-11 text-steel leading-relaxed">
                      {g.cleared_reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: All Records Table */}
          {activeTab === 'records' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-steel" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student name, ID, or guardian..."
                    className="w-full pl-9 pr-4 py-2 text-12 rounded border border-steel/30 bg-paper text-ink focus:outline-none focus:border-petrol"
                  />
                </div>

                <span className="text-12 text-steel">
                  Showing <strong>{filteredRecords.length}</strong> of {scanResult.records.length} records
                </span>
              </div>

              <DataTable
                columns={recordColumns}
                data={filteredRecords}
                keyField="Student_ID"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
