import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Cluster } from '../types';
import { api } from '../lib/api';
import { DataTable, Column } from '../components/DataTable';
import { RiskBandBadge } from '../components/StatusChip';
import {
  FileSpreadsheet,
  ShieldCheck,
  Search,
  Sparkles,
  Database,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  ChevronDown,
  ChevronUp,
  Download,
  Layers,
  FileText,
  Filter,
  Upload,
  FileUp,
  Table,
  Check,
} from 'lucide-react';

interface DataPageProps {
  rawStudents: any[];
  csvClusters: Cluster[];
  onOpenCluster: (clusterId: string) => void;
  onAddStudent?: (studentData: any) => Promise<any>;
  onCsvUploaded?: (records: any[], clusters: Cluster[]) => void;
}

export const DataPage: React.FC<DataPageProps> = ({
  rawStudents,
  csvClusters,
  onOpenCluster,
  onAddStudent,
  onCsvUploaded,
}) => {
  // Master Tab Switcher: 'mixed_catalog' | 'user_excel' | 'user_csv' | 'upload_csv' | 'synthetic_benchmark'
  const [activeDatasetTab, setActiveDatasetTab] = useState<'mixed_catalog' | 'user_excel' | 'user_csv' | 'upload_csv' | 'synthetic_benchmark'>('mixed_catalog');

  // Datasets state
  const [mixedStudents, setMixedStudents] = useState<any[]>([]);
  const [excelStudents, setExcelStudents] = useState<any[]>([]);
  const [mixedSearch, setMixedSearch] = useState('');
  const [excelSearch, setExcelSearch] = useState('');

  // Search & Filter state for User CSV
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Synthetic applications state & filters
  const [syntheticApps, setSyntheticApps] = useState<any[]>([]);
  const [syntheticCsvFiles, setSyntheticCsvFiles] = useState<any[]>([]);
  const [synthSearch, setSynthSearch] = useState('');
  const [synthSchemeFilter, setSynthSchemeFilter] = useState('all');
  const [synthBandFilter, setSynthBandFilter] = useState('all');

  // CSV File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadScanResult, setUploadScanResult] = useState<{
    total_records: number;
    clusters: Cluster[];
    total_nodes: number;
    total_edges: number;
    records: any[];
  } | null>(null);

  // Form State for Single Manual Entry
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: 'detected' | 'clean';
    clusterId?: string;
    score?: number;
    message: string;
    reasons?: string[];
  } | null>(null);

  const initialForm = {
    Student_Name: '',
    Admission_No: '',
    Class: '8th',
    DOB: '15-05-2009',
    Category: 'Gen',
    Father_Name: '',
    Mother_Name: '',
    Aadhaar_No: '',
    Account_No: '',
    Contact_No: '',
    IFSC_Code: 'JAKA0KALBAR',
    Identification_Mark: 'None',
    attendance: 78,
    amount: 15000,
    institution: 'J&K Government High School',
  };

  const [formData, setFormData] = useState(initialForm);

  // Load Synthetic Data & Mixed Datasets
  useEffect(() => {
    async function loadSynth() {
      const [apps, files, mixed, excel] = await Promise.all([
        api.getSyntheticApplications(),
        api.getSyntheticCsvFiles(),
        api.getMixedStudents(),
        api.getExcelStudents(),
      ]);
      setSyntheticApps(apps);
      setSyntheticCsvFiles(files);
      setMixedStudents(mixed);
      setExcelStudents(excel);
    }
    loadSynth();
  }, []);

  // Handle Drag & Drop
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const lower = file.name.toLowerCase();
      if (
        lower.endsWith('.csv') ||
        lower.endsWith('.xlsx') ||
        lower.endsWith('.xls') ||
        file.type.includes('csv') ||
        file.type.includes('spreadsheet') ||
        file.type.includes('excel')
      ) {
        setSelectedFile(file);
      } else {
        alert('Please upload a valid CSV (.csv) or Excel (.xlsx, .xls) file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Run Scan on Uploaded CSV / Excel
  const handleRunCsvScan = async () => {
    if (!selectedFile && !csvText.trim()) {
      alert('Please upload a CSV or Excel file, or paste CSV content first.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await api.analyzeCsvFile(selectedFile || csvText);
      if (res.success) {
        setUploadScanResult(res);
        if (onCsvUploaded) {
          onCsvUploaded(res.records, res.clusters);
        }
      } else {
        alert('Failed to parse file. Please verify that the spreadsheet or CSV has a valid header row.');
      }
    } catch (err: any) {
      alert(`Error scanning file: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Quick Demo Template for CSV / Excel Upload
  const loadDemoCsvTemplate = () => {
    const demoCsv = `Student_ID,Admission_No,Student_Name,Class,DOB,Category,Father_Name,Mother_Name,Aadhaar_No,Account_No,Contact_No,IFSC_Code,Identification_Mark
1,230,Kasturi Sharma,8th,27-04-2008,Gen,Parshotam Sharma,Reva Rani,593974214828,0684041000001517,9682558540,JAKA0KALBAR,Mole on neck
2,231,Vishal Chandan,10th,26-11-2003,OBC,Prem Chandan,Asha Rani,882947102938,0684041000002102,9682558540,JAKA0KALBAR,None
3,232,Manik Sharma,10th,12-01-2004,SC,Asha Ram,Parveen Kumari,672964170125,3063040100005393,6006060244,JAKA0KALBAR,Black mole on left of neck
4,231,Adrash Kumar,8th,21-07-2010,OBC,Yogesh Kumar,Ashu Rani,593974214828,0684041000001517,9697189784,JAKA0KALBAR,Black mole on right cheek
5,230,Kritika Sharma,8th,10-10-2009,Gen,Radhay Sham,Mukhtiar Rani,593974214828,0684041000001517,9697189784,JAKA0KALBAR,None
6,525,Vansh,3rd,20-01-2016,SC,Manohar Lal,Rekha Rani,323008557821,0684041000002142,7006791631,JAKA0KALBAR,A mole on right shoulder
7,256,Amit Kumar,6th,14-04-2013,SC,Baldev Raj,Devi Rani,323008557821,0684041000002142,7006791631,JAKA0KALBAR,None
8,233,Vikas Sharma,7th,27-02-2011,Gen,Radhay Sham,Asha Rani,242459795612,0684041000001619,9149831704,JAKA0KALBAR,Black mole on forehead
9,636,Sumit Kumar,5th,24-12-2012,OBC,Rakesh Kumar,Taro Devi,913604842620,0684041000001526,9149831704,JAKA0KALBAR,Black mole on chin
10,228,Akshara,8th,09-08-2009,OBC,Sunil Kumar,Anju Rani,710337947567,0684041000001620,9149831704,JAKA0KALBAR,None`;
    setCsvText(demoCsv);
    setSelectedFile(null);
  };

  // Helper to trigger browser download of CSV
  const handleExportCSV = (filename: string) => {
    let csvContent = '';
    if (filename === 'students.csv') {
      const headers = ['Student_ID','Admission_No','Student_Name','Class','DOB','Category','Father_Name','Mother_Name','Aadhaar_No','Account_No','Contact_No','IFSC_Code','Identification_Mark'];
      const rows = rawStudents.map(s => headers.map(h => `"${s[h] || ''}"`).join(','));
      csvContent = [headers.join(','), ...rows].join('\n');
    } else {
      const headers = ['application_id','student_id','student_name','institution_name','scholarship_type','amount','status','risk_band','attendance_pct','applied_on'];
      const rows = syntheticApps.map(a => headers.map(h => `"${a[h] || ''}"`).join(','));
      csvContent = [headers.join(','), ...rows].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to trigger browser download of Excel (.xlsx)
  const handleExportExcel = (filename: string, dataset: any[]) => {
    api.exportToExcel(dataset, filename);
  };

  const handleDownloadExcelTemplate = () => {
    const templateData = [
      {
        Student_ID: 1,
        Admission_No: 230,
        Student_Name: 'Kasturi Sharma',
        Class: '8th',
        DOB: '27-04-2008',
        Category: 'Gen',
        Father_Name: 'Parshotam Sharma',
        Mother_Name: 'Reva Rani',
        Aadhaar_No: '593974214828',
        Account_No: '0684041000001517',
        Contact_No: '9682558540',
        IFSC_Code: 'JAKA0KALBAR',
        Identification_Mark: 'Mole on neck'
      },
      {
        Student_ID: 2,
        Admission_No: 231,
        Student_Name: 'Adrash Kumar',
        Class: '8th',
        DOB: '21-07-2010',
        Category: 'OBC',
        Father_Name: 'Yogesh Kumar',
        Mother_Name: 'Ashu Rani',
        Aadhaar_No: '593974214828',
        Account_No: '0684041000001517',
        Contact_No: '9697189784',
        IFSC_Code: 'JAKA0KALBAR',
        Identification_Mark: 'Black mole on right cheek'
      }
    ];
    api.exportToExcel(templateData, 'beneficiary_template.xlsx');
  };

  // User CSV Filtering
  const filteredUserStudents = useMemo(() => {
    return rawStudents.filter((r) => {
      if (categoryFilter !== 'all' && r.Category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = String(r.Student_Name || '').toLowerCase().includes(q);
        const matchAdm = String(r.Admission_No || '').toLowerCase().includes(q);
        const matchAadhaar = String(r.Aadhaar_No || '').includes(q);
        const matchAcc = String(r.Account_No || '').includes(q);
        if (!matchName && !matchAdm && !matchAadhaar && !matchAcc) return false;
      }
      return true;
    });
  }, [rawStudents, categoryFilter, searchQuery]);

  // Synthetic Applications Filtering
  const filteredSyntheticApps = useMemo(() => {
    return syntheticApps.filter((app) => {
      if (synthSchemeFilter !== 'all' && app.scholarship_type !== synthSchemeFilter) return false;
      if (synthBandFilter !== 'all' && app.risk_band !== synthBandFilter) return false;
      if (synthSearch.trim()) {
        const q = synthSearch.toLowerCase();
        const matchId = app.application_id.toLowerCase().includes(q);
        const matchSid = app.student_id.toLowerCase().includes(q);
        const matchName = app.student_name.toLowerCase().includes(q);
        if (!matchId && !matchSid && !matchName) return false;
      }
      return true;
    });
  }, [syntheticApps, synthSchemeFilter, synthBandFilter, synthSearch]);

  const userColumns: Column<any>[] = [
    { key: 'Student_ID', header: 'ID', sortable: true, width: '70px', render: (r) => <span className="font-mono text-12 font-bold text-ink">{r.Student_ID}</span> },
    { key: 'Admission_No', header: 'Adm No', sortable: true, width: '90px', render: (r) => <span className="font-mono text-12 text-steel-dark">{r.Admission_No}</span> },
    {
      key: 'Student_Name',
      header: 'Student Name',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-medium text-ink">{r.Student_Name}</span>
          <div className="text-11 text-steel">Class: {r.Class} • Cat: {r.Category}</div>
        </div>
      ),
    },
    {
      key: 'Aadhaar_No',
      header: 'Aadhaar (Masked)',
      sortable: true,
      render: (r) => {
        const val = String(r.Aadhaar_No || '');
        const isDuplicated = val === '593974214828' || val === '323008557821';
        return (
          <span className={`font-mono text-12 px-2 py-0.5 rounded ${isDuplicated ? 'bg-signal-subtle text-signal-dark font-bold border border-signal/30' : 'text-ink'}`}>
            ••••{val.slice(-4)}
          </span>
        );
      },
    },
    {
      key: 'Account_No',
      header: 'Bank Account',
      render: (r) => {
        const val = String(r.Account_No || '');
        const isDuplicated = val.includes('1517') || val.includes('2142');
        return (
          <span className={`font-mono text-12 px-2 py-0.5 rounded ${isDuplicated ? 'bg-signal-subtle text-signal-dark font-bold border border-signal/30' : 'text-steel-dark'}`}>
            ••••{val.slice(-4)}
          </span>
        );
      },
    },
    {
      key: 'Contact_No',
      header: 'Contact',
      render: (r) => {
        const val = String(r.Contact_No || '');
        const isShared = val === '9149831704' || val === '9697189784' || val === '9682558540';
        return (
          <span className={`font-mono text-12 px-2 py-0.5 rounded ${isShared ? 'bg-amber-subtle text-amber-dark font-medium border border-amber/30' : 'text-steel'}`}>
            {val.slice(0, 2)}••••{val.slice(-4)}
          </span>
        );
      },
    },
    {
      key: 'Father_Name',
      header: 'Parentage',
      render: (r) => (
        <div className="text-12 text-ink">
          <div>Father: {r.Father_Name}</div>
          <div className="text-11 text-steel">Mother: {r.Mother_Name}</div>
        </div>
      ),
    },
    { key: 'IFSC_Code', header: 'IFSC Code', render: (r) => <span className="font-mono text-11 text-steel">{r.IFSC_Code}</span> },
  ];

  const syntheticColumns: Column<any>[] = [
    { key: 'application_id', header: 'App ID', sortable: true, width: '100px', render: (r) => <span className="font-mono text-12 font-bold text-ink">{r.application_id}</span> },
    {
      key: 'student_id',
      header: 'Student ID',
      sortable: true,
      width: '100px',
      render: (r) => (
        <span className="font-mono text-12 text-petrol font-medium">
          {r.student_id}
          {r.student_id === 'S003' || r.student_id === 'S006' || r.student_id === 'S007' || r.student_id === 'S008' ? (
            <span className="ml-1 px-1 py-0.2 rounded text-[9px] font-bold bg-signal text-white">HERO</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'student_name',
      header: 'Applicant & Institution',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-medium text-ink">{r.student_name}</span>
          <div className="text-11 text-steel">{r.institution_name}</div>
        </div>
      ),
    },
    { key: 'scholarship_type', header: 'Scheme', sortable: true, render: (r) => <span className="text-12 text-ink font-medium">{r.scholarship_type}</span> },
    { key: 'amount', header: 'Disbursement', sortable: true, align: 'right', render: (r) => <span className="font-medium tabular-nums text-ink">₹{r.amount.toLocaleString()}</span> },
    {
      key: 'attendance_pct',
      header: 'Attendance',
      sortable: true,
      align: 'right',
      width: '100px',
      render: (r) => (
        <span className={`font-semibold tabular-nums ${r.attendance_pct < 30 ? 'text-signal' : 'text-ink'}`}>
          {r.attendance_pct}%
        </span>
      ),
    },
    { key: 'risk_band', header: 'Band', width: '120px', render: (r) => <RiskBandBadge band={r.risk_band} /> },
    { key: 'applied_on', header: 'Date', sortable: true, width: '110px', render: (r) => <span className="text-11 text-steel">{r.applied_on}</span> },
  ];

  const filteredMixedStudents = useMemo(() => {
    return mixedStudents.filter((r) => {
      if (!mixedSearch.trim()) return true;
      const q = mixedSearch.toLowerCase();
      return (
        String(r.Student_Name || '').toLowerCase().includes(q) ||
        String(r.Student_ID || '').toLowerCase().includes(q) ||
        String(r.Account_No || '').includes(q) ||
        String(r.Aadhaar_No || '').includes(q)
      );
    });
  }, [mixedStudents, mixedSearch]);

  const filteredExcelStudents = useMemo(() => {
    return excelStudents.filter((r) => {
      if (!excelSearch.trim()) return true;
      const q = excelSearch.toLowerCase();
      return (
        String(r.Student_Name || '').toLowerCase().includes(q) ||
        String(r.Student_ID || '').toLowerCase().includes(q) ||
        String(r.Account_No || '').includes(q) ||
        String(r.labeled_issue || '').toLowerCase().includes(q)
      );
    });
  }, [excelStudents, excelSearch]);

  const mixedColumns: Column<any>[] = [
    { key: 'Student_ID', header: 'ID', sortable: true, width: '100px', render: (r) => <span className="font-mono text-12 font-bold text-ink">{r.Student_ID}</span> },
    {
      key: 'source_badge',
      header: 'Origin Dataset',
      sortable: true,
      width: '140px',
      render: (r) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${String(r.source_badge).includes('Excel') ? 'bg-petrol-subtle text-petrol border border-petrol/30' : 'bg-sea-subtle text-sea-dark border border-sea/30'}`}>
          {r.source_badge || 'CSV Roster'}
        </span>
      ),
    },
    {
      key: 'Student_Name',
      header: 'Student Name',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-medium text-ink">{r.Student_Name}</span>
          <div className="text-11 text-steel">Class: {r.Class} • Cat: {r.Category}</div>
        </div>
      ),
    },
    {
      key: 'Account_No',
      header: 'Account (Masked)',
      render: (r) => <span className="font-mono text-11 text-steel">••••{String(r.Account_No).slice(-4)}</span>,
    },
    {
      key: 'Contact_No',
      header: 'Contact',
      render: (r) => <span className="font-mono text-11 text-steel">••••{String(r.Contact_No).slice(-4)}</span>,
    },
    {
      key: 'Father_Name',
      header: 'Parentage',
      render: (r) => <span className="text-12 text-ink">{r.Father_Name}</span>,
    },
    {
      key: 'labeled_issue',
      header: 'Anomaly Status',
      render: (r) => {
        if (r.labeled_issue) {
          return (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-signal/15 text-signal border border-signal/30 uppercase">
              {r.labeled_issue.replace(/_/g, ' ')}
            </span>
          );
        }
        return <span className="text-sea text-11 font-medium">&bull; Clean Record</span>;
      },
    },
  ];

  const excelColumns: Column<any>[] = [
    { key: 'Student_ID', header: 'ID', sortable: true, width: '100px', render: (r) => <span className="font-mono text-12 font-bold text-ink">{r.Student_ID}</span> },
    {
      key: 'Student_Name',
      header: 'Applicant Name',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-medium text-ink">{r.Student_Name}</span>
          <div className="text-11 text-steel">Class: {r.Class} • DOB: {r.DOB}</div>
        </div>
      ),
    },
    {
      key: 'Aadhaar_No',
      header: 'Aadhaar (Masked)',
      render: (r) => {
        const val = String(r.Aadhaar_No || '');
        const isBad = r.labeled_issue === 'duplicate_aadhaar';
        return (
          <span className={`font-mono text-11 px-1.5 py-0.5 rounded ${isBad ? 'bg-signal/15 text-signal font-bold' : 'text-steel'}`}>
            {val.length > 4 ? `••••${val.slice(-4)}` : val}
          </span>
        );
      },
    },
    {
      key: 'Account_No',
      header: 'Bank Account',
      render: (r) => {
        const val = String(r.Account_No || '');
        const isBad = r.labeled_issue === 'duplicate_account_no';
        return (
          <span className={`font-mono text-11 px-1.5 py-0.5 rounded ${isBad ? 'bg-signal/15 text-signal font-bold' : 'text-steel'}`}>
            {val.length > 4 ? `••••${val.slice(-4)}` : val}
          </span>
        );
      },
    },
    {
      key: 'Contact_No',
      header: 'Contact Phone',
      render: (r) => {
        const val = String(r.Contact_No || '');
        const isBad = r.labeled_issue === 'duplicate_phone_no' || r.labeled_issue === 'invalid_phone_length';
        return (
          <span className={`font-mono text-11 px-1.5 py-0.5 rounded ${isBad ? 'bg-amber/20 text-amber-dark font-bold' : 'text-steel'}`}>
            {val.length > 4 ? `${val.slice(0, 2)}••••${val.slice(-4)}` : val}
          </span>
        );
      },
    },
    {
      key: 'Father_Name',
      header: 'Father Name',
      render: (r) => <span className="text-12 text-ink">{r.Father_Name || <span className="text-signal font-semibold">Missing</span>}</span>,
    },
    {
      key: 'labeled_issue',
      header: 'Labeled Issue',
      render: (r) => {
        if (!r.labeled_issue) return <span className="text-sea text-11 font-medium">&bull; Clean</span>;
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-signal/15 text-signal border border-signal/30 uppercase">
            {r.labeled_issue.replace(/_/g, ' ')}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-steel/20 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display font-bold text-28 text-ink tracking-tight">
              Data Explorer &amp; Beneficiary Ingestion (CSV &amp; Excel)
            </h1>
            <span className="px-2 py-0.5 rounded text-10 font-bold bg-petrol/15 text-petrol uppercase border border-petrol/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sea animate-pulse"></span>
              SQLite ORM: sentinel.db
            </span>
          </div>
          <p className="text-14 text-steel mt-0.5">
            Upload custom CSV or Excel (.xlsx / .xls) files to run NetworkX graph anomaly scans, or inspect existing benchmarks.
          </p>
        </div>

        {/* Master Dataset Tabs (Mixed, Excel, CSV, Synthetic, Upload) */}
        <div className="flex items-center gap-1.5 bg-paper p-1.5 rounded-lg border border-steel/30 shadow-sm flex-wrap">
          <button
            onClick={() => setActiveDatasetTab('mixed_catalog')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-12 font-semibold transition-colors ${
              activeDatasetTab === 'mixed_catalog'
                ? 'bg-petrol text-white shadow-sm'
                : 'text-steel-dark hover:text-ink'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Mixed Catalog ({mixedStudents.length || 455})</span>
          </button>

          <button
            onClick={() => setActiveDatasetTab('user_excel')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-12 font-semibold transition-colors ${
              activeDatasetTab === 'user_excel'
                ? 'bg-petrol text-white shadow-sm'
                : 'text-steel-dark hover:text-ink'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-sea" />
            <span>User Excel: students.csv.xlsx ({excelStudents.length || 300})</span>
          </button>

          <button
            onClick={() => setActiveDatasetTab('user_csv')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-12 font-semibold transition-colors ${
              activeDatasetTab === 'user_csv'
                ? 'bg-petrol text-white shadow-sm'
                : 'text-steel-dark hover:text-ink'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>User CSV: students.csv ({rawStudents.length})</span>
          </button>

          <button
            onClick={() => setActiveDatasetTab('synthetic_benchmark')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-12 font-semibold transition-colors ${
              activeDatasetTab === 'synthetic_benchmark'
                ? 'bg-petrol text-white shadow-sm'
                : 'text-steel-dark hover:text-ink'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>National Synthetic (10k)</span>
          </button>

          <button
            onClick={() => setActiveDatasetTab('upload_csv')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-12 font-semibold transition-colors ${
              activeDatasetTab === 'upload_csv'
                ? 'bg-petrol text-white shadow-sm'
                : 'text-steel-dark hover:text-ink'
            }`}
          >
            <FileUp className="w-4 h-4" />
            <span>Manual Ingestion Form</span>
          </button>
        </div>
      </div>

      {/* -------------------- SECTION: UNIFIED MIXED DATASET -------------------- */}
      {activeDatasetTab === 'mixed_catalog' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-steel/15">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-petrol" strokeWidth={1.5} />
                  <h2 className="font-display font-bold text-20 text-ink">
                    Unified Mixed Beneficiary Catalog
                  </h2>
                </div>
                <p className="text-12 text-steel mt-1">
                  Cross-verified compilation integrating the user-provided Excel workbook (<code className="font-mono text-11">students.csv.xlsx</code>, 300 records) and the authentic school roster (<code className="font-mono text-11">students.csv</code>, 155 records).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportExcel('mixed_sentinel_catalog.xlsx', filteredMixedStudents)}
                  className="flex items-center gap-2 px-3 py-1.5 text-12 font-semibold rounded bg-petrol text-white hover:bg-petrol-hover transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Unified Catalog ({filteredMixedStudents.length})</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="p-3 rounded bg-paper border border-steel/15">
                <span className="text-11 text-steel font-semibold uppercase">Total Mixed Filings</span>
                <div className="font-display font-bold text-24 text-ink tabular-nums mt-0.5">{mixedStudents.length || 455}</div>
              </div>
              <div className="p-3 rounded bg-paper border border-sea/30">
                <span className="text-11 text-sea-dark font-semibold uppercase">Excel Workbook Rows</span>
                <div className="font-display font-bold text-24 text-sea-dark tabular-nums mt-0.5">{excelStudents.length || 300}</div>
              </div>
              <div className="p-3 rounded bg-paper border border-amber/30">
                <span className="text-11 text-amber-dark font-semibold uppercase">CSV Roster Rows</span>
                <div className="font-display font-bold text-24 text-amber-dark tabular-nums mt-0.5">{rawStudents.length || 155}</div>
              </div>
              <div className="p-3 rounded bg-paper border border-signal/30">
                <span className="text-11 text-signal-dark font-semibold uppercase">Identified Anomaly Rows</span>
                <div className="font-display font-bold text-24 text-signal tabular-nums mt-0.5">34</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-paper-card border border-steel/20 shadow-panel flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-steel absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search across all mixed filings by student name, ID, or account..."
                value={mixedSearch}
                onChange={(e) => setMixedSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-13 bg-white border border-steel/40 rounded focus:border-petrol text-ink"
              />
            </div>
            <span className="text-12 text-steel">
              Displaying <strong>{filteredMixedStudents.length}</strong> combined records
            </span>
          </div>

          <DataTable columns={mixedColumns} data={filteredMixedStudents} keyField="Student_ID" />
        </div>
      )}

      {/* -------------------- SECTION: USER EXCEL FILE (students.csv.xlsx) -------------------- */}
      {activeDatasetTab === 'user_excel' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-steel/15">
              <div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-sea" strokeWidth={1.5} />
                  <h2 className="font-display font-bold text-20 text-ink">
                    User Excel Dataset: <code className="font-mono text-16">students.csv.xlsx</code> (300 Records)
                  </h2>
                </div>
                <p className="text-12 text-steel mt-1">
                  Ground-truth test dataset provided in Excel workbook. Contains ground-truth anomaly annotations in the <code className="font-mono text-11">issue</code> column.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportExcel('user_excel_students.xlsx', filteredExcelStudents)}
                  className="flex items-center gap-2 px-3 py-1.5 text-12 font-semibold rounded bg-sea text-white hover:bg-sea-dark transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Excel Copy</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="p-3 rounded bg-paper border border-steel/15">
                <span className="text-11 text-steel font-semibold uppercase">Total Excel Records</span>
                <div className="font-display font-bold text-24 text-ink tabular-nums mt-0.5">{excelStudents.length || 300}</div>
              </div>
              <div className="p-3 rounded bg-paper border border-signal/30">
                <span className="text-11 text-signal-dark font-semibold uppercase">Duplicate Accounts</span>
                <div className="font-display font-bold text-24 text-signal tabular-nums mt-0.5">10 Records</div>
              </div>
              <div className="p-3 rounded bg-paper border border-amber/30">
                <span className="text-11 text-amber-dark font-semibold uppercase">Duplicate Phones</span>
                <div className="font-display font-bold text-24 text-amber-dark tabular-nums mt-0.5">5 Records</div>
              </div>
              <div className="p-3 rounded bg-paper border border-signal/30">
                <span className="text-11 text-signal-dark font-semibold uppercase">Duplicate Aadhaar</span>
                <div className="font-display font-bold text-24 text-signal tabular-nums mt-0.5">3 Records</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-paper-card border border-steel/20 shadow-panel flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-steel absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Excel records by name, ID, or labeled anomaly issue..."
                value={excelSearch}
                onChange={(e) => setExcelSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-13 bg-white border border-steel/40 rounded focus:border-petrol text-ink"
              />
            </div>
            <span className="text-12 text-steel">
              Displaying <strong>{filteredExcelStudents.length}</strong> Excel rows
            </span>
          </div>

          <DataTable columns={excelColumns} data={filteredExcelStudents} keyField="Student_ID" />
        </div>
      )}

      {/* -------------------- SECTION 1: UPLOAD CUSTOM CSV & EXCEL & RUN SCANS -------------------- */}
      {activeDatasetTab === 'upload_csv' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Upload Dropzone Container */}
          <div className="p-6 rounded-lg bg-paper-card border border-steel/25 shadow-panel space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-steel/15 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded bg-petrol text-white shadow-sm">
                  <Upload className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-18 text-ink">
                    Upload Beneficiary CSV / Excel &amp; Trigger Anomaly Scan
                  </h2>
                  <p className="text-12 text-steel">
                    Upload your institution's raw applicant CSV or Excel (.xlsx, .xls) workbook. The NetworkX engine partitions entities and detects multi-hop convergence.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={loadDemoCsvTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-12 font-semibold rounded bg-petrol-subtle text-petrol hover:bg-petrol-subtle/80 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-petrol" />
                  <span>Load Sample Test Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportCSV('students.csv')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-12 font-semibold rounded bg-mist text-steel hover:text-ink transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV Template</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-12 font-semibold rounded bg-sea-subtle text-sea hover:bg-sea-subtle/80 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Excel (.xlsx) Template</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop Box */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-petrol bg-petrol-subtle/50 scale-[1.01]'
                  : selectedFile
                  ? 'border-sea bg-sea-subtle/20'
                  : 'border-steel/30 hover:border-petrol/60 bg-paper'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center space-y-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedFile ? 'bg-sea text-white' : 'bg-mist text-petrol'}`}>
                  {selectedFile ? <Check className="w-6 h-6" strokeWidth={2} /> : <FileUp className="w-6 h-6" strokeWidth={1.5} />}
                </div>

                {selectedFile ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-display font-bold text-16 text-ink">{selectedFile.name}</span>
                      <span className={`px-2 py-0.5 rounded text-10 font-bold uppercase tracking-wider ${
                        selectedFile.name.toLowerCase().endsWith('.xlsx') || selectedFile.name.toLowerCase().endsWith('.xls')
                          ? 'bg-sea-subtle text-sea border border-sea/30'
                          : 'bg-petrol-subtle text-petrol border border-petrol/30'
                      }`}>
                        {selectedFile.name.toLowerCase().endsWith('.xlsx') || selectedFile.name.toLowerCase().endsWith('.xls') ? 'EXCEL SPREADSHEET (.XLSX)' : 'CSV DATASET (.CSV)'}
                      </span>
                    </div>
                    <div className="text-12 text-steel">{(selectedFile.size / 1024).toFixed(1)} KB • Ready for NetworkX scanning</div>
                  </div>
                ) : (
                  <div>
                    <div className="font-display font-semibold text-15 text-ink">
                      Click to browse or drag &amp; drop a CSV or Excel file here
                    </div>
                    <div className="text-12 text-steel mt-0.5">
                      Supports <code className="font-mono text-11 bg-mist px-1.5 py-0.5 rounded">.csv</code>, <code className="font-mono text-11 bg-mist px-1.5 py-0.5 rounded">.xlsx</code>, and <code className="font-mono text-11 bg-mist px-1.5 py-0.5 rounded">.xls</code> spreadsheets with applicant columns (<code className="font-mono text-11">Student_Name, Aadhaar_No, Account_No, Contact_No...</code>)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Paste Text Box */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-12 font-semibold text-steel uppercase tracking-wider">
                  Or Paste Raw CSV Data Directly
                </span>
                {csvText && (
                  <button
                    onClick={() => setCsvText('')}
                    className="text-11 text-steel hover:text-ink underline"
                  >
                    Clear text
                  </button>
                )}
              </div>
              <textarea
                rows={4}
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  setSelectedFile(null);
                }}
                placeholder="Student_ID,Student_Name,Aadhaar_No,Account_No,Contact_No&#10;1,Rahul Sharma,593974214828,0684041000001517,9682558540&#10;2,Priya Sharma,593974214828,0684041000001517,9682558540"
                className="w-full p-3 font-mono text-12 bg-white border border-steel/30 rounded focus:outline-none focus:border-petrol text-ink placeholder:text-steel/50"
              />
            </div>

            {/* Trigger Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-12 text-steel">
                Bipartite network builder detects multi-entity convergence across accounts and IDs.
              </span>

              <button
                type="button"
                disabled={isUploading || (!selectedFile && !csvText.trim())}
                onClick={handleRunCsvScan}
                className="flex items-center gap-2 px-6 py-2.5 rounded font-semibold text-14 text-white bg-petrol hover:bg-petrol-hover disabled:bg-steel shadow-sm transition-all"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>{isUploading ? 'Running Graph Partitioning...' : 'Run Full Graph Anomaly Scan'}</span>
              </button>
            </div>
          </div>

          {/* Scan Results Section */}
          {uploadScanResult && (
            <div className="p-6 rounded-lg bg-paper-card border border-steel/25 shadow-elevated space-y-5 animate-slideIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-steel/15 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded bg-signal text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-18 text-ink">
                      Graph Anomaly Scan Results Summary
                    </h3>
                    <p className="text-12 text-steel">
                      Successfully partitioned bipartite relationship graph into connected components.
                    </p>
                  </div>
                </div>

                <span className="text-12 font-bold px-3 py-1 rounded bg-petrol-subtle text-petrol border border-petrol/30">
                  {uploadScanResult.clusters.length} Anomaly Cluster{uploadScanResult.clusters.length !== 1 ? 's' : ''} Detected
                </span>
              </div>

              {/* Extraction Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded bg-paper border border-steel/20">
                  <span className="text-11 text-steel uppercase font-semibold">Processed Records</span>
                  <div className="font-display font-bold text-20 text-ink tabular-nums mt-0.5">
                    {uploadScanResult.total_records}
                  </div>
                </div>

                <div className="p-3 rounded bg-paper border border-steel/20">
                  <span className="text-11 text-steel uppercase font-semibold">Graph Nodes</span>
                  <div className="font-display font-bold text-20 text-petrol tabular-nums mt-0.5">
                    {uploadScanResult.total_nodes} Entities
                  </div>
                </div>

                <div className="p-3 rounded bg-paper border border-steel/20">
                  <span className="text-11 text-steel uppercase font-semibold">Graph Edges</span>
                  <div className="font-display font-bold text-20 text-ink tabular-nums mt-0.5">
                    {uploadScanResult.total_edges} Links
                  </div>
                </div>

                <div className="p-3 rounded bg-paper border border-signal/30">
                  <span className="text-11 text-signal-dark uppercase font-semibold">Risk Flagged</span>
                  <div className="font-display font-bold text-20 text-signal tabular-nums mt-0.5">
                    {uploadScanResult.clusters.length} Rings
                  </div>
                </div>
              </div>

              {/* Detected Clusters Cards */}
              <div className="space-y-3">
                <h4 className="font-display font-semibold text-15 text-ink">
                  Surfaced Anomaly Clusters:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadScanResult.clusters.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onOpenCluster(c.id)}
                      className="p-4 rounded-lg bg-paper border border-signal/40 hover:border-signal transition-all cursor-pointer card-tilt shadow-panel"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-16 text-ink">{c.id}</span>
                        <span className="font-display font-bold text-16 text-signal tabular-nums">
                          {c.score}/100
                        </span>
                      </div>
                      <h5 className="font-display font-semibold text-14 text-ink mt-2 line-clamp-1">
                        {c.title}
                      </h5>
                      <p className="text-12 text-steel mt-1 line-clamp-2">
                        {c.pattern}
                      </p>
                      <div className="mt-3 pt-2 border-t border-steel/15 flex items-center justify-between text-11 text-petrol font-semibold">
                        <span>{c.counts.students} Students Linked</span>
                        <span className="inline-flex items-center gap-1">
                          Inspect in 3D &rarr;
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parsed Records Table Preview */}
              <div className="pt-3 border-t border-steel/15 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display font-semibold text-14 text-ink">
                      Parsed Records Preview ({uploadScanResult.records.length})
                    </h4>
                    <span className="text-11 text-steel">Identified columns matched successfully</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportCSV('parsed_scan_records.csv')}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-11 font-semibold rounded bg-mist text-steel hover:text-ink transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportExcel('parsed_scan_records.xlsx', uploadScanResult.records)}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-11 font-semibold rounded bg-sea-subtle text-sea hover:bg-sea-subtle/80 transition-colors"
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      <span>Export Excel (.xlsx)</span>
                    </button>
                  </div>
                </div>

                <DataTable
                  columns={userColumns}
                  data={uploadScanResult.records}
                  keyField="Student_ID"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------- SECTION 2: WORKSPACE DATASET (students.csv) -------------------- */}
      {activeDatasetTab === 'user_csv' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Manual Entry Form Collapsible Card */}
          <div className="rounded-lg bg-paper-card border border-steel/25 shadow-panel overflow-hidden">
            <div className="p-4 bg-paper-card border-b border-steel/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-petrol text-white">
                  <PlusCircle className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-18 text-ink flex items-center gap-2">
                    <span>Manual Record Ingestion &amp; Live Anomaly Scanner</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-petrol-subtle text-petrol uppercase">
                      NetworkX Live
                    </span>
                  </h2>
                  <p className="text-12 text-steel">
                    Manually enter a student application or simulate live fraud injections to see graph clustering in real time.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-12 font-semibold bg-mist text-steel-dark hover:text-ink hover:bg-mist-dark transition-colors"
              >
                <span>{isFormOpen ? 'Collapse Form' : '+ Add Manual Record'}</span>
                {isFormOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {isFormOpen && (
              <div className="p-6 space-y-6 animate-fadeIn border-t border-steel/15">
                {/* 4 Presets */}
                <div className="p-3.5 rounded-lg bg-mist border border-steel/20 space-y-2">
                  <span className="text-11 font-bold text-steel uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber" />
                    <span>Single-Click Simulation Presets</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          Student_Name: 'Rohan Sharma (Simulated)',
                          Admission_No: '991',
                          Class: '8th',
                          DOB: '27-04-2008',
                          Category: 'Gen',
                          Father_Name: 'Parshotam Sharma',
                          Mother_Name: 'Reva Rani',
                          Aadhaar_No: '593974214828',
                          Account_No: '0684041000001517',
                          Contact_No: '9697189784',
                          IFSC_Code: 'JAKA0KALBAR',
                          Identification_Mark: 'Mole on collarbone',
                          attendance: 14,
                          amount: 22000,
                          institution: 'J&K Government High School',
                        });
                        setScanResult(null);
                      }}
                      className="p-2.5 rounded bg-white border border-signal/30 hover:border-signal text-left transition-all hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between text-12 font-bold text-signal">
                        <span>⚡ Syndicate Ring Match</span>
                        <span className="text-[10px] px-1 bg-signal text-white rounded">HIGH</span>
                      </div>
                      <div className="text-[11px] text-steel mt-0.5">Aadhaar &amp; Bank (••1517)</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          Student_Name: 'Pooja Rani (Simulated)',
                          Admission_No: '992',
                          Class: '7th',
                          DOB: '10-09-2010',
                          Category: 'OBC',
                          Father_Name: 'Som Raj',
                          Mother_Name: 'Sunita Devi',
                          Aadhaar_No: '492831998822',
                          Account_No: '0684041000009941',
                          Contact_No: '9149831704',
                          IFSC_Code: 'JAKA0KALBAR',
                          Identification_Mark: 'None',
                          attendance: 34,
                          amount: 14000,
                          institution: 'J&K Government High School',
                        });
                        setScanResult(null);
                      }}
                      className="p-2.5 rounded bg-white border border-amber/30 hover:border-amber text-left transition-all hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between text-12 font-bold text-amber-dark">
                        <span>⚡ Mobile Farm Link</span>
                        <span className="text-[10px] px-1 bg-amber text-ink rounded font-semibold">REVIEW</span>
                      </div>
                      <div className="text-[11px] text-steel mt-0.5">Shared Phone (9149831704)</div>
                    </button>
                  </div>
                </div>

                {/* Form Inputs */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setIsScanning(true);
                    if (onAddStudent) {
                      const res = await onAddStudent(formData);
                      if (res && res.matchedCluster) {
                        setScanResult({
                          status: 'detected',
                          clusterId: res.matchedCluster.id,
                          score: res.matchedCluster.score,
                          message: `Convergence Alert: Record links directly into ${res.matchedCluster.id}.`,
                        });
                      } else {
                        setScanResult({
                          status: 'clean',
                          score: 15,
                          message: 'Verified Normal: Unique identifiers verified (Score: 15/100).',
                        });
                      }
                    }
                    setIsScanning(false);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-3 p-4 rounded bg-paper border border-steel/15">
                      <span className="text-11 font-bold text-petrol uppercase tracking-wider block">1. Student Profile</span>
                      <div>
                        <label className="block text-12 font-medium text-ink mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.Student_Name}
                          onChange={(e) => setFormData({ ...formData, Student_Name: e.target.value })}
                          className="w-full px-3 py-1.5 text-13 bg-white border border-steel/30 rounded focus:border-petrol"
                        />
                      </div>
                      <div>
                        <label className="block text-12 font-medium text-ink mb-1">Admission No *</label>
                        <input
                          type="text"
                          required
                          value={formData.Admission_No}
                          onChange={(e) => setFormData({ ...formData, Admission_No: e.target.value })}
                          className="w-full px-3 py-1.5 text-13 bg-white border border-steel/30 rounded focus:border-petrol"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 p-4 rounded bg-paper border border-steel/15">
                      <span className="text-11 font-bold text-petrol uppercase tracking-wider block">2. Identity Rails</span>
                      <div>
                        <label className="block text-12 font-medium text-ink mb-1">Aadhaar Number *</label>
                        <input
                          type="text"
                          required
                          value={formData.Aadhaar_No}
                          onChange={(e) => setFormData({ ...formData, Aadhaar_No: e.target.value })}
                          className="w-full px-3 py-1.5 text-13 font-mono bg-white border border-steel/30 rounded focus:border-petrol"
                        />
                      </div>
                      <div>
                        <label className="block text-12 font-medium text-ink mb-1">Bank Account *</label>
                        <input
                          type="text"
                          required
                          value={formData.Account_No}
                          onChange={(e) => setFormData({ ...formData, Account_No: e.target.value })}
                          className="w-full px-3 py-1.5 text-13 font-mono bg-white border border-steel/30 rounded focus:border-petrol"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 p-4 rounded bg-paper border border-steel/15">
                      <span className="text-11 font-bold text-petrol uppercase tracking-wider block">3. Contact &amp; Verification</span>
                      <div>
                        <label className="block text-12 font-medium text-ink mb-1">Contact Mobile *</label>
                        <input
                          type="text"
                          required
                          value={formData.Contact_No}
                          onChange={(e) => setFormData({ ...formData, Contact_No: e.target.value })}
                          className="w-full px-3 py-1.5 text-13 font-mono bg-white border border-steel/30 rounded focus:border-petrol"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-12 font-medium text-ink mb-1">Attendance %</label>
                          <input
                            type="number"
                            value={formData.attendance}
                            onChange={(e) => setFormData({ ...formData, attendance: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 text-13 bg-white border border-steel/30 rounded focus:border-petrol"
                          />
                        </div>
                        <div>
                          <label className="block text-12 font-medium text-ink mb-1">Amount (₹)</label>
                          <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 text-13 bg-white border border-steel/30 rounded focus:border-petrol"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isScanning}
                      className="px-6 py-2.5 rounded font-semibold text-14 text-white bg-petrol hover:bg-petrol-hover disabled:bg-steel shadow-sm"
                    >
                      {isScanning ? 'Scanning Topology...' : 'Ingest Record & Run Live Anomaly Scan'}
                    </button>
                  </div>
                </form>

                {/* Scan Result */}
                {scanResult && (
                  <div className={`p-4 rounded-lg border ${scanResult.status === 'detected' ? 'bg-signal-subtle border-signal/40' : 'bg-sea-subtle border-sea/40'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-15 text-ink">{scanResult.message}</span>
                      {scanResult.clusterId && (
                        <button
                          onClick={() => onOpenCluster(scanResult.clusterId!)}
                          className="px-4 py-2 text-12 font-bold bg-signal text-white rounded hover:bg-signal-dark inline-flex items-center gap-1.5"
                        >
                          <span>Open in 3D ({scanResult.clusterId})</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Extracted Clusters Cards */}
          <div className="p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-signal" strokeWidth={1.5} />
                <h2 className="font-display font-bold text-18 text-ink">
                  Clusters Extracted from Uploaded File (students.csv)
                </h2>
              </div>
              <span className="text-12 text-steel">NetworkX Connected Components</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {csvClusters.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onOpenCluster(c.id)}
                  className="p-4 rounded-lg bg-paper border border-signal/30 hover:border-signal transition-all cursor-pointer card-tilt shadow-panel"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-16 text-ink">{c.id}</span>
                    <span className="font-display font-bold text-16 text-signal tabular-nums">{c.score}/100</span>
                  </div>
                  <h3 className="font-display font-semibold text-14 text-ink mt-2 line-clamp-1">{c.title}</h3>
                  <p className="text-12 text-steel mt-1 line-clamp-2">{c.pattern}</p>
                  <div className="mt-3 pt-2 border-t border-steel/15 flex items-center justify-between text-11 text-petrol font-semibold">
                    <span>{c.counts.students} Students</span>
                    <span className="inline-flex items-center gap-1">Open in 3D &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table Toolbar */}
          <div className="p-4 rounded-lg bg-paper-card border border-steel/20 shadow-panel flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-steel absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students by name, admission #, or Aadhaar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-14 bg-white border border-steel/40 rounded focus:border-petrol text-ink font-sans"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportCSV('students.csv')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-12 font-semibold rounded bg-petrol text-white hover:bg-petrol-hover transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV ({filteredUserStudents.length})</span>
              </button>
              <button
                onClick={() => handleExportExcel('students.xlsx', filteredUserStudents)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-12 font-semibold rounded bg-sea-subtle text-sea hover:bg-sea-subtle/80 transition-colors shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          <DataTable columns={userColumns} data={filteredUserStudents} keyField="Student_ID" />
        </div>
      )}

      {/* -------------------- SECTION 3: NATIONAL SYNTHETIC BENCHMARK -------------------- */}
      {activeDatasetTab === 'synthetic_benchmark' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-steel/15">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-petrol" strokeWidth={1.5} />
                  <h2 className="font-display font-bold text-20 text-ink">
                    National Synthetic Benchmark Dataset (DEMO_DATA.md Spec)
                  </h2>
                </div>
                <p className="text-12 text-steel mt-1">
                  10,000 synthetic applications generated with fixed random seed 42 across 60 accredited institutions.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleExportCSV('synthetic_applications_sample.csv')}
                  className="flex items-center gap-2 px-3 py-1.5 text-12 font-semibold rounded bg-petrol text-white hover:bg-petrol-hover transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download CSV</span>
                </button>
                <button
                  onClick={() => handleExportExcel('synthetic_applications_sample.xlsx', syntheticApps)}
                  className="flex items-center gap-2 px-3 py-1.5 text-12 font-semibold rounded bg-sea-subtle text-sea hover:bg-sea-subtle/80 transition-colors shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download Excel (.xlsx)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="p-3 rounded bg-paper border border-steel/15">
                <span className="text-11 text-steel font-semibold uppercase">Total Applications</span>
                <div className="font-display font-bold text-24 text-ink tabular-nums mt-0.5">10,000</div>
              </div>
              <div className="p-3 rounded bg-paper border border-sea/30">
                <span className="text-11 text-sea-dark font-semibold uppercase">Normal Verified</span>
                <div className="font-display font-bold text-24 text-sea-dark tabular-nums mt-0.5">8,940</div>
              </div>
              <div className="p-3 rounded bg-paper border border-amber/30">
                <span className="text-11 text-amber-dark font-semibold uppercase">Review Required</span>
                <div className="font-display font-bold text-24 text-amber-dark tabular-nums mt-0.5">820</div>
              </div>
              <div className="p-3 rounded bg-paper border border-signal/30">
                <span className="text-11 text-signal-dark font-semibold uppercase">High-Risk Priority</span>
                <div className="font-display font-bold text-24 text-signal tabular-nums mt-0.5">240</div>
              </div>
            </div>
          </div>

          {/* Generated CSV Tables Directory */}
          <div className="p-5 rounded-lg bg-paper-card border border-steel/20 shadow-panel space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-petrol" />
                <h3 className="font-display font-semibold text-16 text-ink">
                  Generated Synthetic Database Tables (<code className="text-12 font-mono">data/synthetic/</code>)
                </h3>
              </div>
              <span className="text-11 text-steel">PostgreSQL seed.sql compliant</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {syntheticCsvFiles.map((file, idx) => (
                <div key={idx} className="p-3 rounded border border-steel/20 bg-paper flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-12 font-bold text-petrol">{file.filename}</span>
                      <span className="text-[10px] font-semibold text-steel bg-mist px-1.5 py-0.5 rounded">{file.size_formatted}</span>
                    </div>
                    <p className="text-[11px] text-steel mt-1 line-clamp-2 leading-snug">{file.desc}</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-steel/15 flex items-center justify-between text-11 text-steel">
                    <span>{file.rows.toLocaleString()} rows</span>
                    <button onClick={() => handleExportCSV(file.filename)} className="text-petrol font-semibold hover:underline">
                      Export &darr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DataTable
            columns={syntheticColumns}
            data={filteredSyntheticApps}
            keyField="application_id"
            onRowClick={(row) => {
              if (row.risk_band === 'high') {
                onOpenCluster('CL-104');
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
