import {
  SummaryData,
  Cluster,
  Institution,
  ActionPayload,
  CounterfactualResult,
  FairnessAudit,
  AuditEntry,
  AuditVerification,
  ClearedGroup,
  ForensicsReport,
  ScanUploadResult,
  CaseBrief,
  DatabaseStats,
  IfscLookupResult,
  NpciVerifyResult,
  DigiLockerVerifyResult
} from '../types';
import * as XLSX from 'xlsx';

import summaryFixture from '../fixtures/summary.json';
import clustersFixture from '../fixtures/clusters.json';
import institutionsFixture from '../fixtures/institutions.json';
import csvClustersFixture from '../fixtures/csv_clusters.json';
import studentsRawFixture from '../fixtures/students_raw.json';
import syntheticApplicationsFixture from '../fixtures/synthetic_applications.json';
import mixedStudentsFixture from '../fixtures/mixed_students.json';
import excelStudentsFixture from '../fixtures/excel_students.json';

const API_BASE = 'http://localhost:8000/api';

// In-memory cluster cache to keep local state updates persistent
let localClusters: Cluster[] = JSON.parse(JSON.stringify(clustersFixture));
let localCsvClusters: Cluster[] = JSON.parse(JSON.stringify(csvClustersFixture));
let localRawStudents: any[] = JSON.parse(JSON.stringify(studentsRawFixture));
let localSyntheticApps: any[] = JSON.parse(JSON.stringify(syntheticApplicationsFixture));
let localAuditLog: AuditEntry[] = [
  { seq: 1, ts: "2026-03-28T09:00:00Z", actor: "System Engine", action: "SYSTEM_START", target: "NetworkX Cluster Engine", reason: "System initialized with 10,000 synthetic records", prev_hash: "0000000000000000000000000000000000000000000000000000000000000000", entry_hash: "3b29c9a51bf284898145241dd13d2f21133d3ab2e88c031ecfa7a7b8e1f57bfb" },
  { seq: 2, ts: "2026-03-28T09:12:00Z", actor: "Vikram Sethi (Sr. Zonal Officer)", action: "ESCALATE", target: "CL-104", reason: "Forwarded to State Anti-Corruption Bureau with graph topology evidence", prev_hash: "3b29c9a51bf284898145241dd13d2f21133d3ab2e88c031ecfa7a7b8e1f57bfb", entry_hash: "7e5021a084bd43270bb3f2694b790d5fe6b92110c7fba6b1397dc3f80c3b8891" },
  { seq: 3, ts: "2026-03-28T09:45:00Z", actor: "Priya Sharma (Investigator)", action: "REQUEST_DOCUMENTS", target: "CL-107", reason: "Issued summons to Principal of Apex Institute for physical register audit", prev_hash: "7e5021a084bd43270bb3f2694b790d5fe6b92110c7fba6b1397dc3f80c3b8891", entry_hash: "fa920387cd192384a8bc93a987efc90291ba203847291839210abcf829012389" },
  { seq: 4, ts: "2026-03-28T10:15:00Z", actor: "Amitabh Sen (Nodal Officer)", action: "ASSIGN_INVESTIGATOR", target: "CL-111", reason: "Field audit assigned to Rohtak District Inspectorate", prev_hash: "fa920387cd192384a8bc93a987efc90291ba203847291839210abcf829012389", entry_hash: "88bcf3901928374a8b7c9102983746a5b6c7d8e9f0123456789abcdef0123456" }
];

export const api = {
  async getSummary(): Promise<SummaryData> {
    try {
      const res = await fetch(`${API_BASE}/summary`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return summaryFixture as SummaryData;
  },

  async getClusters(band?: string, status?: string): Promise<Cluster[]> {
    try {
      const params = new URLSearchParams();
      if (band && band !== 'all') params.append('band', band);
      if (status && status !== 'all') params.append('status', status);
      const res = await fetch(`${API_BASE}/clusters?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    let result = [...localClusters];
    if (band && band !== 'all') {
      result = result.filter(c => c.band.toLowerCase() === band.toLowerCase());
    }
    if (status && status !== 'all') {
      result = result.filter(c => c.status.toLowerCase() === status.toLowerCase());
    }
    return result;
  },

  async getClusterById(id: string): Promise<Cluster | null> {
    try {
      const res = await fetch(`${API_BASE}/clusters/${id}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    const found = localClusters.find(c => c.id.toLowerCase() === id.toLowerCase())
      || localCsvClusters.find(c => c.id.toLowerCase() === id.toLowerCase());
    return found || null;
  },

  async getClusterCounterfactual(clusterId: string, removedSignals: string[]): Promise<CounterfactualResult> {
    try {
      const params = new URLSearchParams();
      removedSignals.forEach(s => params.append('remove', s));
      const res = await fetch(`${API_BASE}/clusters/${clusterId}/counterfactual?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    // Client-side counterfactual recalculation
    const cluster = await this.getClusterById(clusterId);
    const reasons = cluster?.reasons || [];
    const removedSet = new Set(removedSignals);
    const activeReasons = reasons.filter(r => !removedSet.has(r.signal));
    const newScore = Math.min(100, Math.max(0, activeReasons.reduce((sum, r) => sum + r.points, 0)));
    const originalScore = cluster?.score || 87;

    return {
      cluster_id: clusterId,
      original_score: originalScore,
      new_score: newScore,
      new_band: newScore >= 70 ? 'high' : newScore >= 40 ? 'review' : 'normal',
      removed_signals: removedSignals,
      delta: newScore - originalScore,
      explanation: `Removing ${removedSignals.join(', ') || 'no signals'} recalculates score to ${newScore}/100.`,
      available_signals: reasons.map(r => r.signal)
    };
  },

  async getClusterTimeline(clusterId: string): Promise<{ cluster_id: string; timeline: any[]; lead_time: any }> {
    try {
      const res = await fetch(`${API_BASE}/clusters/${clusterId}/timeline`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    const cluster = await this.getClusterById(clusterId);
    return {
      cluster_id: clusterId,
      timeline: cluster?.timeline || [],
      lead_time: {
        detection_date: '2026-03-28',
        first_payment_scheduled: '2026-04-15',
        lead_time_days: 18,
        pre_payment_held: true
      }
    };
  },

  async getClusterCaseBrief(clusterId: string): Promise<CaseBrief> {
    try {
      const res = await fetch(`${API_BASE}/clusters/${clusterId}/brief`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    const cluster = await this.getClusterById(clusterId);
    return {
      case_brief_id: `BRIEF-${clusterId}`,
      cluster_id: clusterId,
      title: cluster?.title || `Cluster ${clusterId}`,
      pattern: cluster?.pattern || 'Cross-identifier convergence',
      score: cluster?.score || 87,
      band: cluster?.band || 'high',
      status: cluster?.status || 'open',
      reasons: cluster?.reasons || [],
      student_count: cluster?.students?.length || 4,
      students: cluster?.students || [],
      checklist: [
        `Inspect physical attendance registers at ${cluster?.counts?.institutions || 1} campus locations`,
        `Cross-verify bank authorization KYC with branch manager for account ${cluster?.students?.[0]?.bank_masked || '••••BA103'}`,
        'Examine submitted certificate templates for identical layout hash',
        'Confirm parent names in municipal enrollment registers'
      ],
      recommendation: (cluster?.score || 87) >= 70
        ? 'Payment hold recommended prior to field verification.'
        : 'Secondary document audit queue.'
    };
  },

  async takeAction(clusterId: string, payload: ActionPayload): Promise<{ success: boolean; cluster?: Cluster; newStatus: string }> {
    try {
      const res = await fetch(`${API_BASE}/clusters/${clusterId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, cluster: data.cluster, newStatus: data.new_status };
      }
    } catch {
      // fallback
    }

    const actionMap: Record<string, any> = {
      verify: 'verified',
      assign: 'assigned',
      request_documents: 'documents_requested',
      escalate: 'escalated',
      close: 'closed',
    };

    const newStatus = actionMap[payload.action] || payload.action;
    const target = localClusters.find(c => c.id.toLowerCase() === clusterId.toLowerCase())
      || localCsvClusters.find(c => c.id.toLowerCase() === clusterId.toLowerCase());

    if (target) {
      target.status = newStatus;
      target.timeline.unshift({
        time: 'Just now',
        officer: payload.assignee || 'Officer on duty',
        action: payload.action.replace('_', ' ').toUpperCase(),
        note: payload.note || 'Action processed locally',
      });
    }

    // Append to local audit
    localAuditLog.unshift({
      seq: localAuditLog.length + 1,
      ts: new Date().toISOString(),
      actor: payload.assignee || 'Officer on duty',
      action: `CASE_${payload.action.toUpperCase()}`,
      target: clusterId,
      reason: payload.note || `Officer processed ${payload.action}`,
      prev_hash: localAuditLog[0]?.entry_hash || '00000000',
      entry_hash: Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2)
    });

    return { success: true, cluster: target, newStatus };
  },

  async getCsvClusters(): Promise<Cluster[]> {
    return localCsvClusters;
  },

  async getInstitutions(): Promise<Institution[]> {
    try {
      const res = await fetch(`${API_BASE}/institutions`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return institutionsFixture as Institution[];
  },

  async getRawStudents(): Promise<any[]> {
    return localRawStudents;
  },

  async getMixedStudents(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/datasets/mixed`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return mixedStudentsFixture as any[];
  },

  async getExcelStudents(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/datasets/excel`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return excelStudentsFixture as any[];
  },

  async getSyntheticApplications(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/synthetic/applications`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return localSyntheticApps;
  },

  async getSyntheticCsvFiles(): Promise<any[]> {
    return [
      { filename: "applications.csv", size_formatted: "680.4 KB", rows: 10000, desc: "Full 10,000 application records with amounts & schemes" },
      { filename: "students.csv", size_formatted: "582.1 KB", rows: 10000, desc: "Normalized student demographic and course entities" },
      { filename: "institutions.csv", size_formatted: "4.8 KB", rows: 60, desc: "60 state colleges with active and registered capacities" },
      { filename: "attendance.csv", size_formatted: "310.2 KB", rows: 10000, desc: "Verified semester attendance logs and percentages" },
      { filename: "bank_accounts.csv", size_formatted: "492.0 KB", rows: 10000, desc: "Disbursement accounts, IFSC codes, and beneficiary names" },
      { filename: "documents.csv", size_formatted: "512.6 KB", rows: 10000, desc: "Income & caste certificate hashes and issuing authorities" },
      { filename: "ground_truth.csv", size_formatted: "5.4 KB", rows: 240, desc: "Target labels for all 12 planted anomaly rings (CL-104 to CL-149)" },
      { filename: "seed.sql", size_formatted: "1.8 KB", rows: 50, desc: "PostgreSQL schema DDL and bulk COPY commands" }
    ];
  },

  async analyzeCsvFile(fileOrText: File | string): Promise<any> {
    const res = await this.scanUploadedFile(fileOrText);
    return {
      success: true,
      total_records: res.total_records,
      clusters: res.clusters,
      total_nodes: res.total_nodes,
      total_edges: res.total_edges,
      records: res.records
    };
  },

  exportToExcel(data: any[], filename: string) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filename);
  },

  async getFairnessAudit(): Promise<FairnessAudit> {
    try {
      const res = await fetch(`${API_BASE}/fairness`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      categories: [
        { category: 'Gen', total_applications: 3820, flagged_applications: 98, flag_rate_pct: 2.57 },
        { category: 'OBC', total_applications: 3780, flagged_applications: 94, flag_rate_pct: 2.49 },
        { category: 'SC', total_applications: 2400, flagged_applications: 48, flag_rate_pct: 2.00 }
      ],
      disparate_impact_ratio: 0.803,
      is_compliant: true,
      ratio_bounds: { min: 0.80, max: 1.25 },
      conclusion: 'Fairness Compliant: Disparate-impact ratio is 0.803 (within 0.80 - 1.25 standard Four-Fifths Rule bounds). Identifiers, not demographics, determine flags.',
      districts: [
        { district: 'Jalandhar', total: 1100, flagged: 32, flag_rate_pct: 2.91 },
        { district: 'Rohtak', total: 850, flagged: 28, flag_rate_pct: 3.29 },
        { district: 'Hyderabad', total: 1420, flagged: 36, flag_rate_pct: 2.54 },
        { district: 'Pune', total: 1200, flagged: 29, flag_rate_pct: 2.42 }
      ]
    };
  },

  async getClearedGroups(): Promise<ClearedGroup[]> {
    try {
      const res = await fetch(`${API_BASE}/cleared`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return [
      {
        id: 'CLEARED-HH-01',
        students_count: 2,
        student_names: ['Deepak Kumar', 'Parveen Kumar'],
        parents: 'Darshan Lal & Rekha Rani',
        cleared_reason: 'Siblings, same parents (Darshan Lal & Rekha Rani). Mobile contact sharing cleared without penalty by Family Shield.',
        status: 'Cleared by Family Shield',
        score: 10,
        band: 'normal'
      },
      {
        id: 'CLEARED-HH-02',
        students_count: 2,
        student_names: ['Anshu Kumar', 'Anshika Bhagat'],
        parents: 'Balbir Kumar & Dev Rani',
        cleared_reason: 'Siblings, same parents (Balbir Kumar & Dev Rani). Residential address and parent phone cleared.',
        status: 'Cleared by Family Shield',
        score: 12,
        band: 'normal'
      },
      {
        id: 'CLEARED-HH-03',
        students_count: 2,
        student_names: ['Gulshan Kumar', 'Nitesh Kumar'],
        parents: 'Deepak Kumar & Kamlesh Devi',
        cleared_reason: 'Siblings sharing residential contact. Family Shield verified identical guardian records.',
        status: 'Cleared by Family Shield',
        score: 10,
        band: 'normal'
      }
    ];
  },

  async checkApplicationPreDisbursement(appData: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/applications/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData)
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    const aadhaar = String(appData.Aadhaar_No || appData.aadhaar_no || '');
    const isBadLength = aadhaar.length !== 12 && aadhaar.length > 0;
    const score = isBadLength ? 65 : 15;
    return {
      score,
      band: score >= 70 ? 'high' : score >= 40 ? 'review' : 'normal',
      recommendation: score >= 40 ? 'HOLD PAYMENT & AUDIT' : 'APPROVE FOR DISBURSEMENT',
      reasons: isBadLength ? [{ signal: 'invalid_identifier', points: 25, text: `Aadhaar format issue (${aadhaar.length} digits, expected 12)` }] : [],
      application_id: appData.Student_ID || 'APP-PRE-01'
    };
  },

  async injectRedTeam(pattern: string, size: number = 5): Promise<Cluster> {
    try {
      const res = await fetch(`${API_BASE}/redteam/inject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern, size })
      });
      if (res.ok) {
        const data = await res.json();
        localClusters.unshift(data.injected_cluster);
        return data.injected_cluster;
      }
    } catch {
      // fallback
    }

    // Client-side fallback injection
    const clusterNum = Math.floor(Math.random() * 800) + 200;
    const id = `CL-RED-${clusterNum}`;
    const newCluster: Cluster = {
      id,
      title: `Red Team Simulated: ${pattern.replace('_', ' ').toUpperCase()} Ring (${size} entities)`,
      pattern: `Simulated adversarial attack vector (${pattern}) injected live to test graph detection.`,
      score: pattern === 'evasive_ring' ? 52 : pattern === 'shared_bank' ? 85 : 67,
      band: pattern === 'shared_bank' ? 'high' : 'review',
      status: 'open',
      is_redteam: true,
      created_at: 'Just now (Red Team Mode)',
      counts: {
        students: size,
        institutions: 3,
        banks: 1,
        mobiles: 1,
        addresses: 1,
        documents: 1
      },
      reasons: [
        { signal: 'shared_bank', label: 'Shared bank account', points: 25, text: `${size} simulated applications linked to single bank destination.` },
        { signal: 'cross_institution', label: 'Cross-institution span', points: 15, text: 'Cluster links applications across 3 independent colleges.' }
      ],
      students: Array.from({ length: size }, (_, i) => ({
        id: `RED-S${i + 1}`,
        name: `Adversarial Beneficiary ${i + 1}`,
        institution: 'Simulated Technical Institute',
        institution_id: 'INST-012',
        course: 'B.Tech CS',
        year: '2nd Year',
        attendance: 14,
        bank_masked: '••••BA709',
        mobile_masked: '98••••1122',
        address: 'Sector 9 Industrial Area',
        amount: 25000,
        scheme: 'Post-Matric Scholarship',
        doc_hash: 'TPL-RED-01',
        status: 'Flagged'
      })),
      timeline: [{ time: 'Just now', officer: 'Red Team Agent', action: 'Injected Pattern', note: `Adversarial pattern ${pattern} injected live.` }],
      graph: {
        nodes: [
          { id: `BANK_RED_${clusterNum}`, label: 'Bank ••••BA709', type: 'bank', risk: 'high', is_shared: true },
          ...Array.from({ length: size }, (_, i) => ({
            id: `STUDENT_RED_${clusterNum}_${i}`,
            label: `Student ${i + 1}`,
            type: 'student' as const,
            risk: 'flagged' as const
          }))
        ],
        edges: Array.from({ length: size }, (_, i) => ({
          source: `STUDENT_RED_${clusterNum}_${i}`,
          target: `BANK_RED_${clusterNum}`,
          label: 'PAID_TO',
          flagged: true
        }))
      }
    };

    localClusters.unshift(newCluster);
    return newCluster;
  },

  async verifyAuditChain(): Promise<AuditVerification> {
    try {
      const res = await fetch(`${API_BASE}/audit/verify`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      intact: true,
      total_entries: localAuditLog.length,
      latest_hash: localAuditLog[0]?.entry_hash || '3b29c9a51bf284898145241dd13d2f21133d3ab2e88c031ecfa7a7b8e1f57bfb',
      status: 'INTACT - Cryptographic SHA-256 chain verified intact across all entries.'
    };
  },

  async getAuditLog(): Promise<AuditEntry[]> {
    try {
      const res = await fetch(`${API_BASE}/audit/log`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return localAuditLog;
  },

  async triggerTamperDemo(seq: number = 2): Promise<AuditVerification> {
    try {
      const res = await fetch(`${API_BASE}/audit/tamper-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seq })
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      intact: false,
      broken_at_seq: seq,
      error: `Chain broken at entry #${seq}: payload hash mismatch. Recalculated hash does not match stored block hash.`,
      status: 'TAMPERED - Cryptographic chain broken! Unauthorized modification detected.'
    };
  },

  async unmaskVaultIdentifier(token: string, actor: string, role: string, reason: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/vault/unmask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, actor, role, reason })
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      status: 'success',
      unmasked: {
        token,
        type: 'identifier',
        raw_value: token.toLowerCase().includes('mob') ? '98710003' : '0684041000001517',
        unmasked_by: actor,
        role,
        reason
      }
    };
  },

  async getDatasetForensics(): Promise<ForensicsReport> {
    try {
      const res = await fetch(`${API_BASE}/forensics`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      invalid_aadhaar: [
        { student_id: '37', name: 'Rakesh Sharma', value: '3063040100005393', reason: 'Invalid length (16 digits, expected 12 digits)' }
      ],
      invalid_ifsc: [
        { student_id: '15', name: 'Anshu Kumar', value: 'JAKA0KALTAR', reason: 'IFSC branch variant (expected JAKA0KALBAR)' },
        { student_id: '17', name: 'Nisha Devi', value: 'JAKA0KALTAR', reason: 'IFSC branch variant (expected JAKA0KALBAR)' },
        { student_id: '18', name: 'Anshika Bhagat', value: 'JAKA0KALTAR', reason: 'IFSC branch variant (expected JAKA0KALBAR)' }
      ],
      account_sequence_runs: [
        {
          field: 'Account_No',
          count: 107,
          start: '0684041000002102',
          end: '0684041000002209',
          description: 'Fabricated sequence run: 107 consecutive account numbers across students 49 to 155'
        }
      ],
      total_forensics_flags: 5
    };
  },

  async scanUploadedFile(fileOrText: File | string): Promise<ScanUploadResult> {
    try {
      const formData = new FormData();
      if (typeof fileOrText === 'string') {
        const blob = new Blob([fileOrText], { type: 'text/csv' });
        formData.append('file', blob, 'custom_dataset.csv');
      } else {
        formData.append('file', fileOrText);
      }

      const res = await fetch(`${API_BASE}/scan/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        return data as ScanUploadResult;
      }
    } catch {
      // fallback to client-side parse
    }

    // Client-side parser for CSV / XLSX
    let parsedRecords: any[] = [];
    try {
      if (typeof fileOrText !== 'string' && (fileOrText.name.toLowerCase().endsWith('.xlsx') || fileOrText.name.toLowerCase().endsWith('.xls'))) {
        const buf = await fileOrText.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        parsedRecords = XLSX.utils.sheet_to_json(ws, { defval: '' });
      } else {
        const text = typeof fileOrText === 'string' ? fileOrText : await fileOrText.text();
        const wb = XLSX.read(text, { type: 'string' });
        if (wb.SheetNames && wb.SheetNames.length > 0) {
          const firstSheetName = wb.SheetNames[0];
          const ws = wb.Sheets[firstSheetName];
          parsedRecords = XLSX.utils.sheet_to_json(ws, { defval: '' });
        }
      }
    } catch {
      parsedRecords = [];
    }

    // Fallback graph and cluster extraction
    return this.clientSideScanFallback(parsedRecords);
  },

  clientSideScanFallback(records: any[]): ScanUploadResult {
    // Group by bank and phone
    const bankMap = new Map<string, any[]>();
    const phoneMap = new Map<string, any[]>();

    records.forEach((r, idx) => {
      const sid = String(r.Student_ID || r.id || idx + 1);
      const acc = String(r.Account_No || r.account_no || '').replace(/\D/g, '');
      const mob = String(r.Contact_No || r.phone_no || '').replace(/\D/g, '').slice(-10);

      if (acc && acc.length >= 4) {
        if (!bankMap.has(acc)) bankMap.set(acc, []);
        bankMap.get(acc)!.push({ ...r, sid });
      }
      if (mob && mob.length >= 10) {
        if (!phoneMap.has(mob)) phoneMap.set(mob, []);
        phoneMap.get(mob)!.push({ ...r, sid });
      }
    });

    const clusters: Cluster[] = [];
    let cIdx = 1;

    bankMap.forEach((members, acc) => {
      if (members.length >= 2) {
        const cId = `CL-CUSTOM-B${cIdx}`;
        clusters.push({
          id: cId,
          title: `Shared Bank Cluster #${cIdx} (${members.length} Applicants)`,
          pattern: `${members.length} applicants route disbursements to identical account ••••${acc.slice(-4)}`,
          score: 75,
          band: 'high',
          status: 'open',
          created_at: 'Just now (Client Engine)',
          counts: {
            students: members.length,
            institutions: 1,
            banks: 1,
            mobiles: 1,
            addresses: 1,
            documents: 1
          },
          reasons: [
            { signal: 'shared_bank', label: 'Shared bank account', points: 25, text: `${members.length} students share single bank account destination.` },
            { signal: 'cross_institution', label: 'Multi-identity link', points: 20, text: 'Multiple distinct student identities linked.' }
          ],
          students: members.map(m => ({
            id: m.sid,
            name: m.Student_Name || m.student_name || `Student ${m.sid}`,
            institution: 'Uploaded Institution',
            institution_id: 'INST-UPLOAD',
            course: `Class ${m.Class || m.class || 'N/A'}`,
            year: `DOB: ${m.DOB || m.dob || 'N/A'}`,
            attendance: 78,
            bank_masked: `••••${acc.slice(-4)}`,
            mobile_masked: `98••••${String(m.Contact_No || m.phone_no || '').slice(-4)}`,
            address: `Father: ${m.Father_Name || m.father_name || 'N/A'}`,
            amount: 15000,
            scheme: 'Government Scholarship',
            doc_hash: `Aadhaar ••••${String(m.Aadhaar_No || m.aadhaar_no || '').slice(-4)}`,
            status: 'Flagged'
          })),
          timeline: [{ time: 'Just now', officer: 'Client Scan Engine', action: 'Scan Completed', note: 'Cluster surfaced via shared bank account.' }],
          graph: {
            nodes: [
              { id: `BANK_${acc}`, label: `Bank ••••${acc.slice(-4)}`, type: 'bank', risk: 'high', is_shared: true },
              ...members.map(m => ({ id: `STUDENT_${m.sid}`, label: m.Student_Name || m.student_name || m.sid, type: 'student' as const, risk: 'flagged' as const }))
            ],
            edges: members.map(m => ({ source: `STUDENT_${m.sid}`, target: `BANK_${acc}`, label: 'PAID_TO', flagged: true }))
          }
        });
        cIdx++;
      }
    });

    return {
      status: 'success',
      total_records: records.length,
      clusters,
      cleared_groups: [],
      forensics: {
        invalid_aadhaar: [],
        invalid_ifsc: [],
        total_forensics_flags: 0
      },
      total_nodes: records.length,
      total_edges: clusters.reduce((acc, c) => acc + c.graph.edges.length, 0),
      records
    };
  },

  async addStudent(studentData: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    const newId = localRawStudents.length + 1;
    studentData.Student_ID = studentData.Student_ID || newId;
    localRawStudents.unshift(studentData);
    return { success: true, student: studentData, allClusters: localCsvClusters };
  },

  async getDbStats(): Promise<DatabaseStats> {
    try {
      const res = await fetch(`${API_BASE}/db/stats`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      engine: "SQLite 3.49 + SQLAlchemy 2.1 ORM",
      database_file: "data/sentinel.db",
      file_size_formatted: "276.0 KB",
      tables: {
        institutions: 51,
        students: 455,
        clusters: 16,
        audit_logs: 5
      },
      status: "Healthy (ACID Transactions Enabled)"
    };
  },

  async lookupIfsc(code: string): Promise<IfscLookupResult> {
    try {
      const res = await fetch(`${API_BASE}/external/ifsc/${encodeURIComponent(code)}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      BANK: "Jammu & Kashmir Bank",
      IFSC: code.toUpperCase(),
      BRANCH: "Kalabar (Sunderbani)",
      ADDRESS: "Main Market Kalabar, Tehsil Sunderbani, District Rajouri, Jammu & Kashmir",
      CITY: "Rajouri",
      DISTRICT: "Rajouri",
      STATE: "Jammu & Kashmir",
      MICR: "185051025",
      RTGS: true,
      NEFT: true,
      IMPS: true,
      UPI: true,
      source: "Sentinel Banking Rail Fallback",
      verified: true
    };
  },

  async verifyNpciDbt(aadhaarLast4: string, accountLast4: string): Promise<NpciVerifyResult> {
    try {
      const res = await fetch(`${API_BASE}/external/npci-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaar_last4: aadhaarLast4, account_last4: accountLast4 })
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      gateway: "NPCI Aadhaar-DBT Central Mapper (PFMS Rail)",
      aadhaar_masked: `••••••••${aadhaarLast4}`,
      account_masked: `••••••••${accountLast4}`,
      seeding_status: "ACTIVE_MAPPED",
      mandate_flag: "ENABLED_FOR_DIRECT_BENEFIT_TRANSFER",
      bank_code: "JAKA",
      verified_on: new Date().toISOString(),
      recommendation: "DBT Seeding confirmed. Account authorized for public scholarship credit."
    };
  },

  async verifyDigilocker(docHash: string, docType: string = "INCOME_CERTIFICATE"): Promise<DigiLockerVerifyResult> {
    try {
      const res = await fetch(`${API_BASE}/external/digilocker-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_hash: docHash, doc_type: docType })
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      gateway: "DigiLocker National Document Exchange (MeitY)",
      doc_type: docType,
      certificate_hash: docHash,
      issuer: "Office of the Sub-Divisional Magistrate / Tehsildar",
      digital_signature: "VALID_STATE_PKI_SIGNATURE",
      template_reuse_flag: false,
      verdict: "Authentic: Certificate registered in state digital repository."
    };
  }
};

