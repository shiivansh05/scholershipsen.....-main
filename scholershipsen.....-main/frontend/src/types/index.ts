export type RiskBand = 'high' | 'review' | 'normal';
export type CaseStatus = 'open' | 'assigned' | 'documents_requested' | 'escalated' | 'closed';

export interface SignalReason {
  signal: string;
  label: string;
  points: number;
  text: string;
}

export interface ClusterStudent {
  id: string;
  name: string;
  institution: string;
  institution_id: string;
  course: string;
  year: string;
  attendance: number;
  bank_masked: string;
  mobile_masked: string;
  address: string;
  amount: number;
  scheme: string;
  doc_hash: string;
  status: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'student' | 'bank' | 'mobile' | 'institution' | 'address' | 'document' | 'aadhaar' | 'guardian';
  risk: 'high' | 'amber' | 'flagged' | 'normal';
  is_shared?: boolean;
  details?: string;
  x?: number;
  y?: number;
  z?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  flagged: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface TimelineItem {
  time: string;
  officer: string;
  action: string;
  note: string;
}

export interface ClearedGroup {
  id: string;
  students_count: number;
  student_names: string[];
  parents?: string;
  cleared_reason: string;
  category?: string;
  status: string;
  score?: number;
  band?: RiskBand;
}

export interface Cluster {
  id: string;
  title: string;
  pattern: string;
  score: number;
  band: RiskBand;
  status: CaseStatus;
  is_hero?: boolean;
  is_redteam?: boolean;
  created_at: string;
  counts: {
    students: number;
    institutions: number;
    banks: number;
    mobiles: number;
    addresses: number;
    documents: number;
  };
  reasons: SignalReason[];
  students: ClusterStudent[];
  timeline: TimelineItem[];
  cleared?: ClearedGroup[];
  graph: GraphData;
}

export interface Institution {
  id: string;
  name: string;
  state: string;
  district: string;
  type: string;
  registered: number;
  active: number;
  applications: number;
  surge_ratio: number;
}

export interface MoneyAtRiskData {
  total_rupees: number;
  total_rupees_formatted: string;
  held_before_disbursement: number;
  held_formatted: string;
  pending_recovery: number;
  recovery_formatted: string;
  high_risk_rupees: number;
  review_rupees: number;
}

export interface SummaryData {
  applications_analyzed: number;
  students_count: number;
  institutions_count: number;
  bands: {
    normal: number;
    review: number;
    high: number;
  };
  clusters_count: {
    total: number;
    high_risk: number;
    review: number;
    normal: number;
  };
  institutions_flagged: number;
  money_at_risk?: MoneyAtRiskData;
  datasets_integrated?: {
    user_csv_count: number;
    user_excel_count: number;
    synthetic_applications: number;
    total_mixed_records: number;
  };
  recent_activities: Array<{
    time: string;
    officer: string;
    action: string;
    cluster_id: string;
    note: string;
  }>;
}

export type ActionType = 'verify' | 'assign' | 'request_documents' | 'escalate' | 'close';

export interface ActionPayload {
  action: ActionType;
  note: string;
  assignee?: string;
}

export interface CounterfactualResult {
  cluster_id: string;
  original_score: number;
  new_score: number;
  new_band: RiskBand;
  removed_signals: string[];
  delta: number;
  explanation: string;
  available_signals?: string[];
}

export interface FairnessCategoryRate {
  category: string;
  total_applications: number;
  flagged_applications: number;
  flag_rate_pct: number;
}

export interface FairnessAudit {
  categories: FairnessCategoryRate[];
  disparate_impact_ratio: number;
  is_compliant: boolean;
  ratio_bounds: { min: number; max: number };
  conclusion: string;
  districts: Array<{
    district: string;
    total: number;
    flagged: number;
    flag_rate_pct: number;
  }>;
}

export interface AuditEntry {
  seq: number;
  ts: string;
  actor: string;
  action: string;
  target: string;
  reason: string;
  prev_hash: string;
  entry_hash: string;
}

export interface AuditVerification {
  intact: boolean;
  total_entries?: number;
  latest_hash?: string;
  status: string;
  broken_at_seq?: number;
  error?: string;
}

export interface ForensicsReport {
  invalid_aadhaar: Array<{ student_id: string; name?: string; value: string; reason: string }>;
  invalid_ifsc: Array<{ student_id: string; name?: string; value: string; reason: string }>;
  account_sequence_runs?: any[];
  mobile_sequence_runs?: any[];
  sequence_runs?: any[];
  near_duplicate_accounts?: any[];
  total_forensics_flags?: number;
}

export interface ScanUploadResult {
  status: string;
  total_records: number;
  clusters: Cluster[];
  cleared_groups: ClearedGroup[];
  forensics: ForensicsReport;
  total_nodes: number;
  total_edges: number;
  records: any[];
}

export interface CaseBrief {
  case_brief_id: string;
  cluster_id: string;
  title: string;
  pattern: string;
  score: number;
  band: RiskBand;
  status: CaseStatus;
  reasons: SignalReason[];
  student_count: number;
  students: ClusterStudent[];
  checklist: string[];
  recommendation: string;
}

export interface DatabaseStats {
  engine: string;
  database_file: string;
  file_size_formatted: string;
  tables: {
    institutions: number;
    students: number;
    clusters: number;
    audit_logs: number;
  };
  status: string;
}

export interface IfscLookupResult {
  BANK: string;
  IFSC: string;
  BRANCH: string;
  ADDRESS: string;
  CITY: string;
  DISTRICT: string;
  STATE: string;
  MICR?: string;
  RTGS?: boolean;
  NEFT?: boolean;
  IMPS?: boolean;
  UPI?: boolean;
  source: string;
  verified: boolean;
}

export interface NpciVerifyResult {
  gateway: string;
  aadhaar_masked: string;
  account_masked: string;
  seeding_status: string;
  mandate_flag: string;
  bank_code: string;
  verified_on: string;
  recommendation: string;
}

export interface DigiLockerVerifyResult {
  gateway: string;
  doc_type: string;
  certificate_hash: string;
  issuer: string;
  digital_signature: string;
  template_reuse_flag: boolean;
  verdict: string;
}

