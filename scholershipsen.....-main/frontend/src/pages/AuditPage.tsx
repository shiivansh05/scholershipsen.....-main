import React, { useState, useEffect } from 'react';
import {
  AuditEntry,
  AuditVerification,
  DatabaseStats,
  IfscLookupResult,
  NpciVerifyResult,
  DigiLockerVerifyResult
} from '../types';
import { api } from '../lib/api';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  User,
  Hash,
  Eye,
  EyeOff,
  Database,
  Server,
  Globe,
  RefreshCw,
  CheckCircle,
  Building,
  CreditCard,
  FileCheck,
  ExternalLink,
  Cpu
} from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [verification, setVerification] = useState<AuditVerification | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTampering, setIsTampering] = useState(false);

  // Vault Unmask State
  const [unmaskToken, setUnmaskToken] = useState('TOK_ACC_3b8a1c90ef2281a4');
  const [unmaskReason, setUnmaskReason] = useState('FIR Investigation Case #402 / Anti-Corruption Court Order');
  const [unmaskRole, setUnmaskRole] = useState('Investigator');
  const [unmaskedResult, setUnmaskedResult] = useState<any | null>(null);
  const [isUnmasking, setIsUnmasking] = useState(false);

  // Database State
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // Live Gateway Verification States
  const [ifscCode, setIfscCode] = useState('JAKA0KALBAR');
  const [ifscResult, setIfscResult] = useState<IfscLookupResult | null>(null);
  const [isLoadingIfsc, setIsLoadingIfsc] = useState(false);

  const [npciAadhaar, setNpciAadhaar] = useState('1234');
  const [npciAccount, setNpciAccount] = useState('5678');
  const [npciResult, setNpciResult] = useState<NpciVerifyResult | null>(null);
  const [isLoadingNpci, setIsLoadingNpci] = useState(false);

  const [digiHash, setDigiHash] = useState('DOC-SHA-992');
  const [digiType, setDigiType] = useState('INCOME_CERTIFICATE');
  const [digiResult, setDigiResult] = useState<DigiLockerVerifyResult | null>(null);
  const [isLoadingDigi, setIsLoadingDigi] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [log, ver, stats] = await Promise.all([
        api.getAuditLog(),
        api.verifyAuditChain(),
        api.getDbStats()
      ]);
      setAuditLog(log);
      setVerification(ver);
      setDbStats(stats);
      // Automatically run initial IFSC lookup for demo
      handleLookupIfsc('JAKA0KALBAR');
    }
    loadData();
  }, []);

  const handleRefreshDb = async () => {
    setIsLoadingDb(true);
    try {
      const stats = await api.getDbStats();
      setDbStats(stats);
    } finally {
      setIsLoadingDb(false);
    }
  };

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      const ver = await api.verifyAuditChain();
      setVerification(ver);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTamperDemo = async () => {
    setIsTampering(true);
    try {
      const ver = await api.triggerTamperDemo(2);
      setVerification(ver);
    } finally {
      setIsTampering(false);
    }
  };

  const handleUnmask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unmaskReason.trim()) return;
    setIsUnmasking(true);
    try {
      const res = await api.unmaskVaultIdentifier(
        unmaskToken,
        'Rajesh Verma, IAS (Audit Lead)',
        unmaskRole,
        unmaskReason
      );
      setUnmaskedResult(res.unmasked);
      // Refresh audit log to show unmask entry
      const updatedLog = await api.getAuditLog();
      setAuditLog(updatedLog);
      const updatedVer = await api.verifyAuditChain();
      setVerification(updatedVer);
    } finally {
      setIsUnmasking(false);
    }
  };

  const handleLookupIfsc = async (codeToLookup?: string) => {
    const code = codeToLookup || ifscCode;
    if (!code.trim()) return;
    setIsLoadingIfsc(true);
    try {
      const res = await api.lookupIfsc(code);
      setIfscResult(res);
    } finally {
      setIsLoadingIfsc(false);
    }
  };

  const handleVerifyNpci = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingNpci(true);
    try {
      const res = await api.verifyNpciDbt(npciAadhaar, npciAccount);
      setNpciResult(res);
    } finally {
      setIsLoadingNpci(false);
    }
  };

  const handleVerifyDigi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingDigi(true);
    try {
      const res = await api.verifyDigilocker(digiHash, digiType);
      setDigiResult(res);
    } finally {
      setIsLoadingDigi(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-steel/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-28 text-ink tracking-tight">
              Enterprise Ledger, Database &amp; Gateways
            </h1>
            <span className="px-2 py-0.5 rounded text-11 font-bold bg-petrol text-white uppercase tracking-wider">
              Production Stack
            </span>
          </div>
          <p className="text-14 text-steel mt-0.5">
            ACID SQLite persistence, cryptographic SHA-256 hash chains, field-level privacy vault, and live national banking rails.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="flex items-center gap-2 px-4 py-2 text-12 font-semibold rounded bg-petrol text-white hover:bg-petrol-hover transition-colors shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-paper" />
            <span>{isVerifying ? 'Verifying...' : 'Verify Audit Chain'}</span>
          </button>

          <button
            onClick={handleTamperDemo}
            disabled={isTampering}
            className="flex items-center gap-2 px-3.5 py-2 text-12 font-semibold rounded bg-signal-subtle text-signal-dark hover:bg-signal-subtle/80 border border-signal/30 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-signal" />
            <span>Simulate Tampering (Demo)</span>
          </button>
        </div>
      </div>

      {/* Verification Status Card */}
      {verification && (
        <div
          className={`p-5 rounded-lg border shadow-panel transition-all ${
            verification.intact
              ? 'bg-paper-card border-sea/30 bg-gradient-to-r from-paper-card to-sea-subtle/20'
              : 'bg-paper-card border-signal/40 bg-gradient-to-r from-paper-card to-signal-subtle/30 ring-1 ring-signal/30'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {verification.intact ? (
                  <CheckCircle2 className="w-5 h-5 text-sea" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-signal" />
                )}
                <h3 className="font-display font-bold text-18 text-ink">
                  {verification.status}
                </h3>
              </div>
              <p className="text-12 text-steel">
                {verification.intact
                  ? 'All block pointer hashes match payload contents. No retroactive modifications detected in history.'
                  : verification.error}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-11 text-steel uppercase font-semibold">Ledger Length</span>
              <div className="font-display font-bold text-20 text-ink tabular-nums">
                {auditLog.length} Records
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: RELATIONAL DATABASE ENGINE (SQLITE & SQLALCHEMY) */}
      <div className="p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-steel/15 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-petrol/10 text-petrol flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-16 text-ink">
                  Relational Database Engine (SQLite &amp; SQLAlchemy 2.0 ORM)
                </h3>
                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-sea/15 text-sea-dark uppercase">
                  ACID Transactions Active
                </span>
              </div>
              <p className="text-11 text-steel">
                Persistent relational storage backing institutions, students, anomaly clusters, and audit records.
              </p>
            </div>
          </div>

          <button
            onClick={handleRefreshDb}
            disabled={isLoadingDb}
            className="flex items-center gap-1.5 px-3 py-1.5 text-11 font-semibold rounded bg-mist hover:bg-mist/80 text-ink border border-steel/25 transition-colors self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-steel ${isLoadingDb ? 'animate-spin' : ''}`} />
            <span>Refresh Engine Stats</span>
          </button>
        </div>

        {dbStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3 rounded border border-steel/15 bg-paper space-y-1">
              <span className="text-[10px] uppercase font-bold text-steel">Storage Engine</span>
              <div className="text-12 font-bold text-ink truncate" title={dbStats.engine}>
                {dbStats.engine}
              </div>
              <div className="text-[10px] text-steel font-mono">{dbStats.database_file}</div>
            </div>

            <div className="p-3 rounded border border-steel/15 bg-paper space-y-1">
              <span className="text-[10px] uppercase font-bold text-steel">Institutions Table</span>
              <div className="text-18 font-bold font-display text-ink tabular-nums">
                {dbStats.tables.institutions}
              </div>
              <div className="text-[10px] text-steel">Indexed by U-DISE / Inst ID</div>
            </div>

            <div className="p-3 rounded border border-steel/15 bg-paper space-y-1">
              <span className="text-[10px] uppercase font-bold text-steel">Beneficiaries Table</span>
              <div className="text-18 font-bold font-display text-petrol tabular-nums">
                {dbStats.tables.students}
              </div>
              <div className="text-[10px] text-steel">Full Roster (User CSV + Excel)</div>
            </div>

            <div className="p-3 rounded border border-steel/15 bg-paper space-y-1">
              <span className="text-[10px] uppercase font-bold text-steel">Clusters Table</span>
              <div className="text-18 font-bold font-display text-amber tabular-nums">
                {dbStats.tables.clusters}
              </div>
              <div className="text-[10px] text-steel">Graph Anomaly Entities</div>
            </div>

            <div className="p-3 rounded border border-steel/15 bg-paper space-y-1">
              <span className="text-[10px] uppercase font-bold text-steel">DB File Size</span>
              <div className="text-18 font-bold font-display text-sea tabular-nums">
                {dbStats.file_size_formatted}
              </div>
              <div className="text-[10px] text-sea-dark font-medium">Zero-Leak WAL Mode</div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: LIVE NATIONAL BANKING & GOVERNMENT GATEWAYS */}
      <div className="p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel space-y-4">
        <div className="flex items-center gap-2.5 border-b border-steel/15 pb-3">
          <div className="w-8 h-8 rounded bg-petrol/10 text-petrol flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-16 text-ink">
                Live National Verification Rails &amp; Banking APIs
              </h3>
              <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-petrol/15 text-petrol uppercase">
                Direct External APIs
              </span>
            </div>
            <p className="text-11 text-steel">
              Real-time verification against Razorpay Indian Banking Gateway, NPCI PFMS DBT Mapper, and DigiLocker PKI Registry.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Gateway 1: Live Razorpay Banking IFSC Resolver */}
          <div className="p-4 rounded border border-steel/20 bg-paper space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-11 font-bold uppercase text-petrol flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  National IFSC Rail
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sea/15 text-sea-dark font-semibold">
                  Live API
                </span>
              </div>
              <p className="text-11 text-steel leading-relaxed">
                Queries live Indian banking clearing rail via <code className="text-10 font-mono text-ink">https://ifsc.razorpay.com</code>.
              </p>

              <div>
                <label className="block text-10 font-semibold uppercase text-steel mb-1">
                  Enter IFSC Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="flex-1 px-2.5 py-1.5 text-12 font-mono uppercase rounded border border-steel/30 bg-paper-card text-ink focus:outline-none focus:border-petrol"
                    placeholder="e.g. JAKA0KALBAR"
                  />
                  <button
                    type="button"
                    onClick={() => handleLookupIfsc()}
                    disabled={isLoadingIfsc}
                    className="px-3 py-1.5 text-11 font-semibold rounded bg-petrol text-white hover:bg-petrol-hover transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isLoadingIfsc ? 'Querying...' : 'Query'}
                  </button>
                </div>
              </div>

              {/* Quick sample chips */}
              <div className="flex flex-wrap gap-1 pt-1">
                {['JAKA0KALBAR', 'JAKA0KALTAR', 'SBIN0000691', 'PUNB0022200'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setIfscCode(chip);
                      handleLookupIfsc(chip);
                    }}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-mist border border-steel/20 text-steel-dark hover:border-petrol hover:text-petrol transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {ifscResult && (
              <div className="p-3 rounded bg-mist/70 border border-steel/20 text-11 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">{ifscResult.BANK}</span>
                  <span className="font-mono text-[10px] bg-sea/15 text-sea-dark px-1.5 py-0.2 rounded font-bold">
                    VERIFIED
                  </span>
                </div>
                <div className="text-steel leading-tight">
                  <strong>Branch:</strong> {ifscResult.BRANCH} ({ifscResult.CITY || ifscResult.DISTRICT})
                </div>
                <div className="text-[10px] text-steel truncate" title={ifscResult.ADDRESS}>
                  {ifscResult.ADDRESS}
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-steel/15 text-[10px] font-mono text-steel">
                  <span>RTGS: {ifscResult.RTGS ? '✓' : '✗'}</span>
                  <span>NEFT: {ifscResult.NEFT ? '✓' : '✗'}</span>
                  <span>IMPS: {ifscResult.IMPS ? '✓' : '✗'}</span>
                  <span>UPI: {ifscResult.UPI ? '✓' : '✗'}</span>
                </div>
                <div className="text-[9px] text-steel font-mono pt-0.5">
                  Source: {ifscResult.source}
                </div>
              </div>
            )}
          </div>

          {/* Gateway 2: NPCI Aadhaar-DBT Central Mapper */}
          <div className="p-4 rounded border border-steel/20 bg-paper space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-11 font-bold uppercase text-petrol flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  NPCI DBT Mapper (PFMS Rail)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber/15 text-amber-dark font-semibold">
                  Aadhaar Rail
                </span>
              </div>
              <p className="text-11 text-steel leading-relaxed">
                Verifies if beneficiary bank account has active Direct Benefit Transfer mandate mapped on NPCI server.
              </p>

              <form onSubmit={handleVerifyNpci} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-10 font-semibold uppercase text-steel mb-0.5">
                      Aadhaar (Last 4)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={npciAadhaar}
                      onChange={(e) => setNpciAadhaar(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-12 font-mono rounded border border-steel/30 bg-paper-card text-ink focus:outline-none focus:border-petrol"
                    />
                  </div>
                  <div>
                    <label className="block text-10 font-semibold uppercase text-steel mb-0.5">
                      Account (Last 4)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={npciAccount}
                      onChange={(e) => setNpciAccount(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-12 font-mono rounded border border-steel/30 bg-paper-card text-ink focus:outline-none focus:border-petrol"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoadingNpci}
                  className="w-full py-1.5 text-11 font-semibold rounded bg-petrol text-white hover:bg-petrol-hover transition-colors shadow-sm disabled:opacity-50"
                >
                  {isLoadingNpci ? 'Verifying NPCI...' : 'Verify DBT Seeding Mandate'}
                </button>
              </form>
            </div>

            {npciResult && (
              <div className="p-3 rounded bg-mist/70 border border-steel/20 text-11 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">{npciResult.seeding_status}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    npciResult.seeding_status === 'ACTIVE_MAPPED' ? 'bg-sea/15 text-sea-dark' : 'bg-signal/15 text-signal'
                  }`}>
                    {npciResult.seeding_status === 'ACTIVE_MAPPED' ? 'ACTIVE' : 'WARNING'}
                  </span>
                </div>
                <div className="text-[10px] text-steel">
                  Aadhaar: <code className="font-mono">{npciResult.aadhaar_masked}</code> | Account: <code className="font-mono">{npciResult.account_masked}</code>
                </div>
                <p className="text-[10px] text-ink leading-tight">
                  {npciResult.recommendation}
                </p>
                <div className="text-[9px] text-steel font-mono pt-0.5">
                  Gateway: {npciResult.gateway}
                </div>
              </div>
            )}
          </div>

          {/* Gateway 3: DigiLocker Certificate Authenticator */}
          <div className="p-4 rounded border border-steel/20 bg-paper space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-11 font-bold uppercase text-petrol flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5" />
                  DigiLocker PKI Authenticator
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-petrol/15 text-petrol font-semibold">
                  MeitY Rail
                </span>
              </div>
              <p className="text-11 text-steel leading-relaxed">
                Verifies digital signature against state public key infrastructure and detects synthetic template reuse.
              </p>

              <form onSubmit={handleVerifyDigi} className="space-y-2">
                <div>
                  <label className="block text-10 font-semibold uppercase text-steel mb-0.5">
                    Certificate Hash / Template ID
                  </label>
                  <input
                    type="text"
                    value={digiHash}
                    onChange={(e) => setDigiHash(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-12 font-mono rounded border border-steel/30 bg-paper-card text-ink focus:outline-none focus:border-petrol"
                    placeholder="e.g. DOC-SHA-992 or TPL-INC-991"
                  />
                </div>

                <div className="flex gap-2">
                  {['DOC-SHA-992', 'TPL-INC-991'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDigiHash(preset)}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-mist border border-steel/20 text-steel-dark hover:border-petrol"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isLoadingDigi}
                  className="w-full py-1.5 text-11 font-semibold rounded bg-petrol text-white hover:bg-petrol-hover transition-colors shadow-sm disabled:opacity-50"
                >
                  {isLoadingDigi ? 'Authenticating...' : 'Validate Digital Signature'}
                </button>
              </form>
            </div>

            {digiResult && (
              <div className="p-3 rounded bg-mist/70 border border-steel/20 text-11 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">{digiResult.digital_signature}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    !digiResult.template_reuse_flag ? 'bg-sea/15 text-sea-dark' : 'bg-signal/15 text-signal'
                  }`}>
                    {!digiResult.template_reuse_flag ? 'PASSED' : 'FLAGGED'}
                  </span>
                </div>
                <div className="text-[10px] text-steel">
                  Issuer: {digiResult.issuer}
                </div>
                <p className="text-[10px] text-ink leading-tight">
                  {digiResult.verdict}
                </p>
                <div className="text-[9px] text-steel font-mono pt-0.5">
                  Gateway: {digiResult.gateway}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: PRIVACY VAULT & CRYPTOGRAPHIC LEDGER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Unmasking Tool Form (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-petrol" />
            <h3 className="font-display font-bold text-16 text-ink">
              Privacy Vault: PII Unmasking Tool
            </h3>
          </div>
          <p className="text-12 text-steel leading-relaxed">
            Raw Aadhaar and account numbers are encrypted at rest with HMAC tokens. Authorized officers must log legal grounds to reveal sensitive records.
          </p>

          <form onSubmit={handleUnmask} className="space-y-3">
            <div>
              <label className="block text-11 font-semibold uppercase text-steel mb-1">
                HMAC Pseudonym Token
              </label>
              <input
                type="text"
                value={unmaskToken}
                onChange={(e) => setUnmaskToken(e.target.value)}
                className="w-full px-3 py-2 text-12 font-mono rounded border border-steel/30 bg-paper text-ink focus:outline-none focus:border-petrol"
                placeholder="TOK_ACC_..."
                required
              />
            </div>

            <div>
              <label className="block text-11 font-semibold uppercase text-steel mb-1">
                Officer Authorization Role
              </label>
              <select
                value={unmaskRole}
                onChange={(e) => setUnmaskRole(e.target.value)}
                className="w-full px-3 py-2 text-12 rounded border border-steel/30 bg-paper text-ink focus:outline-none focus:border-petrol"
              >
                <option value="Investigator">Investigator (Field Verification)</option>
                <option value="Supervisor">Supervisor (Nodal Officer)</option>
                <option value="State Vigilance">State Vigilance Commission</option>
              </select>
            </div>

            <div>
              <label className="block text-11 font-semibold uppercase text-steel mb-1">
                Justification &amp; Legal Order No.
              </label>
              <textarea
                value={unmaskReason}
                onChange={(e) => setUnmaskReason(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-12 rounded border border-steel/30 bg-paper text-ink focus:outline-none focus:border-petrol"
                placeholder="Enter mandatory case justification..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={isUnmasking}
              className="w-full py-2.5 text-12 font-semibold rounded bg-petrol text-white hover:bg-petrol-hover transition-colors shadow-sm inline-flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isUnmasking ? 'Unmasking & Logging...' : 'Request PII Decryption'}</span>
            </button>
          </form>

          {/* Unmasked Result Display */}
          {unmaskedResult && (
            <div className="p-3.5 rounded bg-mist border border-steel/20 space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-11 font-semibold uppercase text-petrol">Decrypted Record</span>
                <span className="text-[10px] text-steel">Audit Entry Logged</span>
              </div>
              <div className="font-mono text-14 font-bold text-ink">
                Value: {unmaskedResult.raw_value}
              </div>
              <div className="text-11 text-steel">
                Unmasked by: <strong className="text-ink">{unmaskedResult.unmasked_by}</strong> ({unmaskedResult.role})
              </div>
            </div>
          )}
        </div>

        {/* Cryptographic Ledger Table (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-16 text-ink">
                Append-Only Audit Chain (SHA-256)
              </h3>
              <p className="text-12 text-steel">
                Each block hashes the previous block hash: <code className="text-11 font-mono">SHA256(prev_hash + payload)</code>
              </p>
            </div>
            <span className="text-11 text-steel font-mono">
              {auditLog.length} Chain Blocks
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {auditLog.map((entry) => (
              <div
                key={entry.seq}
                className="p-3 rounded border border-steel/15 bg-paper hover:bg-mist/40 transition-colors text-12 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-petrol text-white font-mono text-[10px] font-bold flex items-center justify-center">
                      #{entry.seq}
                    </span>
                    <span className="font-semibold text-ink">{entry.action}</span>
                    <span className="font-mono text-11 bg-mist px-1.5 py-0.2 rounded text-steel-dark">
                      {entry.target}
                    </span>
                  </div>
                  <span className="text-11 text-steel tabular-nums">{entry.ts}</span>
                </div>

                <p className="text-ink text-11 leading-snug">
                  Reason: {entry.reason}
                </p>

                <div className="pt-1.5 border-t border-steel/10 flex items-center justify-between text-[10px] font-mono text-steel">
                  <span>Actor: {entry.actor}</span>
                  <span title={entry.entry_hash}>
                    Hash: {entry.entry_hash ? `${entry.entry_hash.slice(0, 10)}...${entry.entry_hash.slice(-6)}` : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
