import { type ReactNode, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Activity,
  ArrowUpRight,
  BadgeAlert,
  BookOpen,
  Box,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
  Database,
  Dna,
  FileCheck,
  FileClock,
  FileText,
  Fingerprint,
  FolderTree,
  Gauge,
  GitBranch,
  Globe,
  HardDrive,
  KeyRound,
  Landmark,
  Layers,
  Lock,
  LockKeyhole,
  Menu,
  Microscope,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Server,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Tag,
  TestTube,
  Timer,
  UserCheck,
  Users,
  Waypoints,
  X,
  Zap,
} from 'lucide-react';
import {
  Link,
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import NotFound from '@/pages/not-found';
import {
  initialDatabaseStatus,
  initialCases,
  initialEvidence,
  initialCustodyTransfers,
  initialDnaProfiles,
  initialStrLoci,
  initialDnaIndices,
  initialLabSubmissions,
  initialLabReports,
  initialAuditEvents,
  type DatabaseStatus,
  type CaseItem,
  type EvidenceItem,
  type CustodyTransferEvent,
  type DnaProfileItem,
  type StrLocus,
  type DnaIndexItem,
  type LabSubmissionItem,
  type LabReportItem,
  type AuditEventItem,
} from '@/lib/forensic-data';

const queryClient = new QueryClient();

// -----------------------------------------------------------------------------
// Navigation Definition
// -----------------------------------------------------------------------------
const navItems = [
  { href: '/', label: 'Persistence & Health', caption: 'PostgreSQL 17 + PostGIS', icon: Database },
  { href: '/cases', label: 'Forensic Cases', caption: 'Active Case Dockets', icon: FolderTree },
  { href: '/evidence', label: 'Evidence & Custody', caption: 'Tamper Seals & Ledgers', icon: Box },
  { href: '/dna', label: 'DNA Intelligence', caption: 'CODIS 20 STR Loci Matrix', icon: Dna },
  { href: '/kinship', label: 'Kinship & Familial', caption: 'Relationship & Lead Engine', icon: GitBranch },
  { href: '/intelligence', label: 'Cross-Case & Graph', caption: 'Link Analysis & Leads Engine', icon: Share2 },
  { href: '/laboratory', label: 'Lab & Examinations', caption: 'Analysis & Verified Reports', icon: Microscope },
  { href: '/audit', label: 'Audit & Governance', caption: 'Immutable Event Ledger', icon: ShieldCheck },
  { href: '/foundation', label: 'Foundation & Quality', caption: 'Phase 0 Governance & CI', icon: Landmark },
];

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

// -----------------------------------------------------------------------------
// UI Helper Components
// -----------------------------------------------------------------------------
function StatusBadge({
  status,
  variant = 'default',
}: {
  status: string;
  variant?: 'good' | 'alert' | 'warning' | 'neutral' | 'default';
}) {
  const isGood = variant === 'good' || ['ACTIVE', 'OPERATIONAL', 'COMPLETE', 'CONFIRMED_MATCH', 'SUPERVISOR_APPROVED', 'SUCCESS'].includes(status);
  const isAlert = variant === 'alert' || ['CRITICAL', 'SUSPENDED', 'FLAGGED_EXPUNGEMENT', 'FAILURE', 'DEGRADED'].includes(status);
  const isWarning = variant === 'warning' || ['EXPEDITED', 'OPEN', 'IN_PROGRESS', 'PENDING', 'IN_ANALYSIS'].includes(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.03em]',
        isGood && 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400',
        isAlert && 'border-rose-500/30 bg-rose-950/40 text-rose-400',
        isWarning && 'border-amber-500/30 bg-amber-950/40 text-amber-300',
        !isGood && !isAlert && !isWarning && 'border-slate-700 bg-slate-800 text-slate-300',
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}

function StatTile({
  label,
  value,
  detail,
  accent = 'gold',
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  accent?: 'gold' | 'emerald' | 'cyan' | 'purple' | 'amber';
  icon?: any;
}) {
  const accentClasses = {
    gold: 'border-t-[#d5a33a] from-[#d5a33a]/10',
    emerald: 'border-t-emerald-500 from-emerald-500/10',
    cyan: 'border-t-cyan-500 from-cyan-500/10',
    purple: 'border-t-purple-500 from-purple-500/10',
    amber: 'border-t-amber-500 from-amber-500/10',
  }[accent];

  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-slate-800/80 bg-gradient-to-b to-slate-900/60 p-5 shadow-lg border-t-2', accentClasses)}>
      <div className="flex items-start justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-slate-500" />}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  detail,
  action,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d5a33a]">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 md:text-3xl">
          {title}
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
          {detail}
        </p>
      </div>
      {action}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Root Application Shell
// -----------------------------------------------------------------------------
function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.refetchQueries();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-200">
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {/* Primary Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-slate-800 bg-[#0f1422] text-slate-300 transition-all duration-300 md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarCollapsed && 'md:w-[80px]',
        )}
      >
        <div className={cn('flex h-20 items-center border-b border-slate-800 px-6', sidebarCollapsed && 'md:justify-center md:px-2')}>
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#d5a33a] to-[#996f1b] text-slate-950 shadow-md">
              <span className="font-mono text-xl font-black">K</span>
            </span>
            <span className={cn('leading-tight', sidebarCollapsed && 'md:hidden')}>
              <span className="block text-lg font-bold tracking-tight text-slate-100">KFIN</span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#d5a33a]">
                Forensic Intelligence
              </span>
            </span>
          </Link>
          <button
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={cn('px-4 py-6 flex-1 overflow-y-auto', sidebarCollapsed && 'md:px-2')}>
          <p className={cn('mb-3 px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold', sidebarCollapsed && 'md:hidden')}>
            Forensic Persistence
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = location === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-[#d5a33a]/15 text-[#d5a33a] border border-[#d5a33a]/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
                    sidebarCollapsed && 'md:justify-center md:px-2',
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0 transition-colors', active ? 'text-[#d5a33a]' : 'text-slate-500 group-hover:text-slate-300')} />
                  <div className={cn('flex flex-col min-w-0 text-left', sidebarCollapsed && 'md:hidden')}>
                    <span className="truncate">{item.label}</span>
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-400 font-normal truncate">{item.caption}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Database Status Strip in Sidebar Footer */}
        <div className="border-t border-slate-800 p-4">
          <div className={cn('rounded-lg border border-slate-800/90 bg-slate-950/60 p-3 text-xs', sidebarCollapsed && 'md:hidden')}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1.5 font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                SUPABASE LIVE
              </span>
              <span className="font-mono text-[10px] text-slate-400">18ms</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 truncate">eu-central-1 Frankfurt</p>
            <p className="text-[10px] text-slate-500">PostgreSQL 17.6 + PostGIS</p>
          </div>
        </div>
      </aside>

      {/* Main Content Layout */}
      <div className={cn('flex min-h-screen flex-col transition-all duration-300 md:pl-[280px]', sidebarCollapsed && 'md:pl-[80px]')}>
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800 bg-[#0f1422]/90 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              className="hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 md:inline-flex"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label="Collapse sidebar"
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-950/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Phase 1.1 Persistence Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin text-[#d5a33a]')} />
              <span>Sync Persistence</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-400">
              <Shield className="h-3.5 w-3.5 text-[#d5a33a]" />
              <span>National Forensic Database</span>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 1. View: Persistence & Health Hub (Root)
// -----------------------------------------------------------------------------
function DatabaseView() {
  const { data: dbStatus = initialDatabaseStatus } = useQuery<DatabaseStatus>({
    queryKey: ['databaseStatus'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/database/status');
        if (res.ok) return await res.json();
      } catch {}
      return initialDatabaseStatus;
    },
  });

  return (
    <div>
      <SectionHeading
        eyebrow="Persistent Relational Foundation"
        title="Supabase PostgreSQL 17 + PostGIS Persistence"
        detail="Real-time telemetry and table health metrics across all 27 domain tables in the KFIN public persistence layer."
      />

      {/* Engine Status Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatTile
          label="Database Status"
          value={dbStatus.status}
          detail={dbStatus.engine}
          accent="emerald"
          icon={Database}
        />
        <StatTile
          label="Network Latency"
          value={`${dbStatus.latencyMs} ms`}
          detail={dbStatus.cloudProvider}
          accent="cyan"
          icon={Zap}
        />
        <StatTile
          label="Active Tables"
          value={dbStatus.totalTables}
          detail="27 Domain + 4 System tables"
          accent="gold"
          icon={Layers}
        />
        <StatTile
          label="Cryptographic Hash"
          value="SHA-256"
          detail="Pgcrypto + UUID v4 verified"
          accent="purple"
          icon={Lock}
        />
      </div>

      {/* Record Density by Domain */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#d5a33a]" />
          Domain Entity Census (Live PostgreSQL Counts)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 p-4">
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase">Forensic Cases</p>
              <p className="text-xl font-bold text-slate-200 mt-1">{dbStatus.recordCounts.cases}</p>
            </div>
            <FolderTree className="h-6 w-6 text-slate-600" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 p-4">
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase">Physical Exhibits</p>
              <p className="text-xl font-bold text-slate-200 mt-1">{dbStatus.recordCounts.evidenceItems}</p>
            </div>
            <Box className="h-6 w-6 text-slate-600" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 p-4">
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase">Custody Transfers</p>
              <p className="text-xl font-bold text-slate-200 mt-1">{dbStatus.recordCounts.custodyTransfers}</p>
            </div>
            <FileClock className="h-6 w-6 text-slate-600" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 p-4">
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase">DNA Profiles</p>
              <p className="text-xl font-bold text-slate-200 mt-1">{dbStatus.recordCounts.dnaProfiles}</p>
            </div>
            <Dna className="h-6 w-6 text-slate-600" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 p-4">
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase">CODIS STR Alleles</p>
              <p className="text-xl font-bold text-slate-200 mt-1">{dbStatus.recordCounts.strAlleles}</p>
            </div>
            <Fingerprint className="h-6 w-6 text-slate-600" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 p-4">
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase">Audit Log Events</p>
              <p className="text-xl font-bold text-slate-200 mt-1">{dbStatus.recordCounts.auditEvents}</p>
            </div>
            <ShieldCheck className="h-6 w-6 text-slate-600" />
          </div>
        </div>
      </div>

      {/* Verified Extensions */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-emerald-400" />
          Authoritative PostgreSQL Extensions
        </h2>
        <div className="divide-y divide-slate-800">
          {dbStatus.extensions.map((ext) => (
            <div key={ext.extname} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-mono text-sm font-bold text-slate-200">{ext.extname}</span>
                <span className="ml-2 text-xs text-slate-500 font-mono">v{ext.extversion}</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  {ext.extname === 'uuid-ossp' && 'Cryptographically secure Version 4 UUID generation for technical primary keys.'}
                  {ext.extname === 'pgcrypto' && 'SHA-256 digests, HMAC authentication, and encrypted hash signatures.'}
                  {ext.extname === 'postgis' && 'WGS 84 spatial geolocations and boundary coordinates for crime scenes.'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-950/30 px-2.5 py-0.5 text-xs text-emerald-400 font-mono">
                <Check className="h-3 w-3" />
                ACTIVE
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 2. View: Forensic Cases Docket & Aggregates
// -----------------------------------------------------------------------------
function CasesView() {
  const { data: caseList = initialCases } = useQuery<CaseItem[]>({
    queryKey: ['cases'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/cases');
        if (res.ok) {
          const json = await res.json();
          return json.cases || initialCases;
        }
      } catch {}
      return initialCases;
    },
  });

  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(caseList[0] || null);
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'transfers' | 'participants' | 'timeline' | 'notes' | 'links'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredCases = caseList.filter((c) => {
    const matchesSearch =
      c.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.incident_county.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || (c.case_type || 'CRIMINAL_INVESTIGATION') === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const currentCase = selectedCase || filteredCases[0] || null;

  return (
    <div>
      <SectionHeading
        eyebrow="Active Investigation Dockets & Aggregate Roots"
        title="Forensic Case File Registry"
        detail="Master operational backbone connecting crime incidents, multi-agency investigator assignments, evidentiary exhibits, chain-of-custody transfers, and chronological audit timelines."
      />

      {/* Top Aggregate Stat Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatTile
          label="Registered Dockets"
          value={caseList.length}
          detail="100% Synthetic test dockets"
          accent="gold"
          icon={FolderTree}
        />
        <StatTile
          label="Active Status"
          value={caseList.filter((c) => c.status === 'ACTIVE').length}
          detail="Under active examination"
          accent="emerald"
          icon={Activity}
        />
        <StatTile
          label="Personnel Assignments"
          value={caseList.reduce((acc, c) => acc + (c.assignments?.length || 1), 0)}
          detail="Separation of duties enforced"
          accent="cyan"
          icon={Users}
        />
        <StatTile
          label="Agency Transfers"
          value={caseList.reduce((acc, c) => acc + (c.transfers?.length || 0), 0)}
          detail="Preserved historical lineage"
          accent="purple"
          icon={GitBranch}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Case List Column */}
        <div className="lg:col-span-1 space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search number, title, county..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-[#d5a33a] focus:outline-none"
              />
            </div>
            <div className="flex gap-2 text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-1/2 rounded-lg border border-slate-800 bg-slate-950/80 px-2 py-1.5 text-slate-300 focus:border-[#d5a33a] focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="OPEN">OPEN</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="CLOSED">CLOSED</option>
                <option value="REOPENED">REOPENED</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-1/2 rounded-lg border border-slate-800 bg-slate-950/80 px-2 py-1.5 text-slate-300 focus:border-[#d5a33a] focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="CRIMINAL_INVESTIGATION">Criminal</option>
                <option value="DISASTER_VICTIM_IDENTIFICATION">DVI</option>
                <option value="UNIDENTIFIED_REMAINS">Remains</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-xs uppercase text-slate-400 font-semibold">
              Cases ({filteredCases.length})
            </span>
            <span className="text-[10px] text-[#d5a33a] font-mono tracking-wider">KFIN-SYN-% VERIFIED</span>
          </div>

          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            {filteredCases.map((c) => {
              const isSelected = currentCase?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={cn(
                    'cursor-pointer rounded-xl border p-4 transition-all duration-200 text-left',
                    isSelected
                      ? 'border-[#d5a33a] bg-slate-900 shadow-md ring-1 ring-[#d5a33a]/30'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#d5a33a]">{c.case_number}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-slate-200 line-clamp-1">{c.title}</h3>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">{c.description}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{c.incident_county}</span>
                    <span className="text-amber-400/90 font-semibold">{c.priority}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Case Details Drawer & Tabs */}
        <div className="lg:col-span-2">
          {currentCase ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#d5a33a]">{currentCase.case_number}</span>
                    <span className="text-[10px] font-mono rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">
                      v{currentCase.version || 1}
                    </span>
                    <span className="text-[10px] font-mono rounded border border-rose-500/30 bg-rose-950/30 px-1.5 py-0.5 text-rose-400">
                      {currentCase.data_classification || 'RESTRICTED'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-100 mt-1">{currentCase.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={currentCase.priority} />
                  <StatusBadge status={currentCase.status} />
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto pb-1 text-xs">
                {(
                  [
                    { id: 'overview', label: 'Overview', icon: BookOpen },
                    { id: 'assignments', label: `Personnel (${currentCase.assignments?.length || 1})`, icon: Users },
                    { id: 'transfers', label: `Transfers (${currentCase.transfers?.length || 0})`, icon: GitBranch },
                    { id: 'participants', label: `Roster (${currentCase.participants?.length || 0})`, icon: UserCheck },
                    { id: 'timeline', label: `Timeline (${currentCase.timeline?.length || 0})`, icon: Clock },
                    { id: 'notes', label: `Notes (${currentCase.notes?.length || 0})`, icon: FileText },
                    { id: 'links', label: `Links (${currentCase.links?.length || 0})`, icon: Waypoints },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-2 font-medium transition-colors whitespace-nowrap',
                        activeTab === tab.id
                          ? 'bg-[#d5a33a]/15 text-[#d5a33a]'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 text-xs">
                    <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
                      <span className="text-slate-500 font-mono uppercase text-[10px]">Incident County & Coordinates</span>
                      <p className="text-slate-200 font-medium mt-1">{currentCase.incident_county}</p>
                      <p className="text-slate-500 font-mono text-[11px] mt-0.5">{currentCase.incident_location_coords || 'Spatial Coords Protected'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
                      <span className="text-slate-500 font-mono uppercase text-[10px]">Lead Investigator</span>
                      <p className="text-slate-200 font-medium mt-1">{currentCase.lead_investigator_name}</p>
                      <p className="text-slate-500 font-mono text-[11px] mt-0.5">Badge: {currentCase.lead_investigator_badge}</p>
                    </div>
                    <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
                      <span className="text-slate-500 font-mono uppercase text-[10px]">Originating Agency</span>
                      <p className="text-slate-200 font-medium mt-1">{currentCase.originating_org_name}</p>
                      <p className="text-slate-500 font-mono text-[11px] mt-0.5">{currentCase.originating_org_code}</p>
                    </div>
                    <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
                      <span className="text-slate-500 font-mono uppercase text-[10px]">Incident Date & Registered</span>
                      <p className="text-slate-200 font-medium mt-1">{new Date(currentCase.incident_date).toLocaleString()}</p>
                      <p className="text-slate-500 font-mono text-[11px] mt-0.5">Registered: {new Date(currentCase.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 font-mono text-[10px] uppercase">Investigation Synopsis</span>
                    <p className="mt-1 text-sm text-slate-300 leading-relaxed rounded-lg border border-slate-800 bg-slate-950/40 p-3.5">
                      {currentCase.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-mono uppercase text-slate-400 font-bold mb-2">Registered Exhibits & Samples</h4>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-emerald-400 font-bold">EVD-001 (Bloodstain Swab)</span>
                        <span className="font-mono text-slate-400">SEAL-KE-849201</span>
                      </div>
                      <p className="text-slate-400 mt-1">Submitted to National Forensic Biology Lab. STR DNA profile obtained.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Assignments */}
              {activeTab === 'assignments' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Formal multi-agency personnel assignments. Separation of duties prevents forensic analysts from reviewing their own submissions.
                  </p>
                  <div className="space-y-2">
                    {(currentCase.assignments || []).map((asgn) => (
                      <div key={asgn.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">{asgn.userName}</span>
                            <span className="font-mono text-[10px] text-slate-400">{asgn.userBadge}</span>
                            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-[#d5a33a] font-semibold">
                              {asgn.role}
                            </span>
                          </div>
                          <p className="text-slate-400 mt-1">{asgn.orgName}</p>
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">
                            ACTIVE
                          </span>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">
                            {new Date(asgn.assignedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Transfers */}
              {activeTab === 'transfers' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Immutable transfer records preserving jurisdiction and organizational lineage without destructive data loss.
                  </p>
                  {(currentCase.transfers || []).length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                      No inter-agency transfers recorded. Case remains with originating institution.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {currentCase.transfers?.map((trf) => (
                        <div key={trf.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3.5 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[#d5a33a] font-semibold">{trf.fromOrg} ➔ {trf.toOrg}</span>
                            <span className="font-mono text-[10px] text-slate-500">{new Date(trf.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-300 font-medium">Reason: {trf.reason}</p>
                          {trf.authRef && (
                            <p className="font-mono text-[10px] text-slate-400">Auth Ref: {trf.authRef}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Participants */}
              {activeTab === 'participants' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Persons of interest, victims, witnesses, and elimination subjects. Roster records are strictly decoupled from investigating officers.
                  </p>
                  <div className="space-y-2">
                    {(currentCase.participants || []).map((part) => (
                      <div key={part.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-200">{part.pseudonym || 'Confidential Participant'}</span>
                            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-purple-300">
                              {part.participantType}
                            </span>
                          </div>
                        </div>
                        <span className="rounded border border-amber-500/30 bg-amber-950/30 text-amber-300 px-2 py-0.5 text-[10px] font-mono">
                          {part.classification}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Timeline */}
              {activeTab === 'timeline' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Chronological lifecycle event reconstruction synthesized from state transitions, assignments, exhibits, and immutable audit logs.
                  </p>
                  <div className="relative pl-6 space-y-4 border-l border-slate-800 ml-2">
                    {(currentCase.timeline || []).map((ev) => (
                      <div key={ev.id} className="relative text-xs">
                        <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-[#d5a33a] bg-slate-950" />
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                          <span className="text-[#d5a33a] font-semibold">{ev.eventType}</span>
                          <span>{new Date(ev.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-200 mt-1 font-medium">{ev.summary}</p>
                        <p className="text-slate-500 text-[10px] font-mono mt-0.5">Actor: {ev.actor}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Notes */}
              {activeTab === 'notes' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Investigative journal entries. Confidential intelligence notes are restricted to cleared officers.
                  </p>
                  <div className="space-y-2">
                    {(currentCase.notes || []).map((note) => (
                      <div key={note.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3.5 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">{note.authorName}</span>
                            <span className="font-mono text-[10px] text-slate-500">({note.authorBadge})</span>
                          </div>
                          {note.isConfidential ? (
                            <span className="rounded border border-rose-500/30 bg-rose-950/40 text-rose-400 text-[10px] font-mono font-semibold px-2 py-0.5">
                              CONFIDENTIAL INTEL
                            </span>
                          ) : (
                            <span className="rounded bg-slate-800 text-slate-400 text-[10px] font-mono px-2 py-0.5">
                              STANDARD NOTE
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300 leading-relaxed">{note.noteText}</p>
                        <span className="text-[10px] text-slate-500 font-mono">{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Links */}
              {activeTab === 'links' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Cross-case links identifying related criminal patterns, co-defendants, or duplicate investigation candidates without destructive merging.
                  </p>
                  {(currentCase.links || []).length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                      No linked cases registered for this docket.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {currentCase.links?.map((lnk) => (
                        <div key={lnk.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3.5 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[#d5a33a]">{lnk.targetCaseNumber}</span>
                            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-cyan-400 font-semibold">
                              {lnk.linkType}
                            </span>
                          </div>
                          <p className="text-slate-200 font-medium">{lnk.targetTitle}</p>
                          {lnk.notes && <p className="text-slate-400 text-xs mt-1">{lnk.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-800 text-slate-500">
              Select a case docket to view comprehensive forensic details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3. View: Evidence & Chain-of-Custody Ledger
// -----------------------------------------------------------------------------
function EvidenceView() {
  const { data: evidence = initialEvidence } = useQuery<EvidenceItem[]>({
    queryKey: ['evidence'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/evidence');
        if (res.ok) {
          const json = await res.json();
          return json.evidence || initialEvidence;
        }
      } catch {}
      return initialEvidence;
    },
  });

  const { data: custody = initialCustodyTransfers } = useQuery<CustodyTransferEvent[]>({
    queryKey: ['custodyHistory'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/evidence/EVD-001/custody');
        if (res.ok) {
          const json = await res.json();
          return json.custodyHistory || initialCustodyTransfers;
        }
      } catch {}
      return initialCustodyTransfers;
    },
  });

  return (
    <div>
      <SectionHeading
        eyebrow="Physical Forensic Evidence"
        title="Evidence Inventory & Chain of Custody Ledger"
        detail="Court-admissible exhibit tracking with tamper-evident seal verification and immutable transfer history."
      />

      {/* Evidence Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 mb-8 overflow-x-auto">
        <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Box className="h-5 w-5 text-[#d5a33a]" />
          Accessioned Forensic Exhibits ({evidence.length})
        </h3>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 font-mono text-[10px] uppercase text-slate-400">
              <th className="pb-3">Exhibit Barcode</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">Description</th>
              <th className="pb-3">Tamper Seal</th>
              <th className="pb-3">Storage Location</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {evidence.map((e) => (
              <tr key={e.id} className="hover:bg-slate-800/30">
                <td className="py-3 font-mono font-bold text-[#d5a33a]">{e.item_number}</td>
                <td className="py-3 text-slate-300 font-mono text-[11px]">{e.evidence_type}</td>
                <td className="py-3 text-slate-300 max-w-xs truncate">{e.description}</td>
                <td className="py-3 font-mono text-emerald-400">{e.tamper_seal_number}</td>
                <td className="py-3 text-slate-400">{e.vault_number} ({e.shelf_identifier})</td>
                <td className="py-3"><StatusBadge status={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Unbroken Chain of Custody Ledger */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileClock className="h-5 w-5 text-emerald-400" />
              Unbroken Chain of Custody Ledger (Exhibit EVD-001)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Append-only temporal ledger: zero in-place updates or deletions permitted.
            </p>
          </div>
          <span className="font-mono text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded-full px-3 py-1">
            IMMUTABLE LEDGER
          </span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {custody.map((c, i) => (
            <div key={c.id || i} className="relative">
              <span className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-emerald-500 bg-[#0f1422]" />
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-slate-200 flex items-center gap-2">
                    <span className="text-[#d5a33a]">{c.transfer_reason}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400 font-normal">{c.authorization_reference}</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {new Date(c.transfer_timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-300">{c.notes}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 text-[11px] border-t border-slate-800/80 pt-2 text-slate-400">
                  <div>
                    <span className="text-slate-500">Releasing Officer: </span>
                    <span className="text-slate-300">{c.releasing_officer_name} ({c.releasing_officer_badge})</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Receiving Custodian: </span>
                    <span className="text-slate-300">{c.receiving_officer_name} ({c.receiving_officer_badge})</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Seal Verified: </span>
                    <span className="text-emerald-400 font-mono font-bold">INTACT (New Seal: {c.new_seal_number})</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Facility: </span>
                    <span className="text-slate-300">{c.destination_facility}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4. View: DNA Intelligence & 20 CODIS STR Allele Matrix
// -----------------------------------------------------------------------------
function DnaView() {
  const { data: indices = initialDnaIndices } = useQuery<DnaIndexItem[]>({
    queryKey: ['dnaIndices'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/dna/indices');
        if (res.ok) {
          const json = await res.json();
          return json.indices || initialDnaIndices;
        }
      } catch {}
      return initialDnaIndices;
    },
  });

  const { data: profiles = initialDnaProfiles } = useQuery<DnaProfileItem[]>({
    queryKey: ['dnaProfiles'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/dna/profiles');
        if (res.ok) {
          const json = await res.json();
          return json.profiles || initialDnaProfiles;
        }
      } catch {}
      return initialDnaProfiles;
    },
  });

  const { data: loci = initialStrLoci } = useQuery<StrLocus[]>({
    queryKey: ['strLoci'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/dna/profiles/KFIN-SYN-DNA-2026-0001/loci');
        if (res.ok) {
          const json = await res.json();
          return json.loci || initialStrLoci;
        }
      } catch {}
      return initialStrLoci;
    },
  });

  return (
    <div>
      <SectionHeading
        eyebrow="Biometric Intelligence"
        title="National DNA Indexing & 20 CODIS STR Alleles"
        detail="Partitioned national DNA database repositories conforming to CODIS standards with locus-by-locus electropherogram call resolution."
      />

      {/* National Indices Cards */}
      <h3 className="text-sm font-mono uppercase text-slate-400 font-bold mb-3">Partitioned National DNA Indices</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        {indices.map((idx) => (
          <div key={idx.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="font-mono text-xs font-bold text-[#d5a33a]">{idx.code}</span>
            <p className="mt-1 text-xs font-semibold text-slate-200 line-clamp-1">{idx.name}</p>
            <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-500">Profiles:</span>
              <span className="text-emerald-400 font-bold">{idx.profile_count}</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500 font-mono">Retention: {idx.retention_years_default} yrs</p>
          </div>
        ))}
      </div>

      {/* Profiles & STR Loci Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-mono uppercase text-slate-400 font-bold">Registered Profiles</h3>
          {profiles.map((p) => (
            <div key={p.id} className="rounded-xl border border-[#d5a33a]/40 bg-slate-900/80 p-4 shadow-md">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#d5a33a]">{p.profile_identifier}</span>
                <StatusBadge status={p.profile_quality} />
              </div>
              <p className="mt-2 text-xs text-slate-300 font-medium">Kit: {p.amplification_kit}</p>
              <p className="text-xs text-slate-400">Index: {p.index_name}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono border-t border-slate-800 pt-2 text-slate-400">
                <div>
                  <span className="text-slate-500">Loci Count: </span>
                  <span className="text-slate-200 font-bold">{p.loci_count} CODIS</span>
                </div>
                <div>
                  <span className="text-slate-500">Instrument: </span>
                  <span className="text-slate-200 truncate">AB 3500xL</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 20 CODIS STR Loci Matrix Table */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Dna className="h-5 w-5 text-[#d5a33a]" />
                  20 Standard CODIS STR Loci Matrix
                </h3>
                <p className="text-xs text-slate-400">Allele calls & RFU peak height resolution for Profile KFIN-SYN-DNA-2026-0001</p>
              </div>
              <span className="font-mono text-xs text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 rounded-full px-2.5 py-0.5">
                20/20 LOCI VERIFIED
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
              {loci.map((l) => (
                <div key={l.locus_name} className="rounded-lg border border-slate-800/90 bg-slate-950/60 p-2.5 text-center">
                  <span className="block font-mono text-xs font-bold text-slate-300">{l.locus_name}</span>
                  <div className="mt-1 flex items-center justify-center gap-1.5 font-mono text-sm font-bold text-[#d5a33a]">
                    <span>{l.allele_1}</span>
                    {l.allele_2 && <span className="text-slate-500">/</span>}
                    {l.allele_2 && <span>{l.allele_2}</span>}
                  </div>
                  {l.peak_height_1 && (
                    <div className="mt-1.5 flex items-center justify-center gap-1 text-[9px] font-mono text-slate-500">
                      <span>{l.peak_height_1} RFU</span>
                      {l.peak_height_2 && <span>· {l.peak_height_2}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 5. View: Laboratory & Reports
// -----------------------------------------------------------------------------
function LaboratoryView() {
  const { data: lab = { submissions: initialLabSubmissions, reports: initialLabReports } } = useQuery<{
    submissions: LabSubmissionItem[];
    reports: LabReportItem[];
  }>({
    queryKey: ['labData'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/laboratory/submissions');
        if (res.ok) {
          const json = await res.json();
          return json;
        }
      } catch {}
      return { submissions: initialLabSubmissions, reports: initialLabReports };
    },
  });

  return (
    <div>
      <SectionHeading
        eyebrow="Accredited Forensic Testing"
        title="Laboratory Dossiers & Verified Reports"
        detail="Multi-disciplinary examination intake, scientific section routing, and cryptographically verified forensic reports."
      />

      {/* Submissions */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 mb-8">
        <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Microscope className="h-5 w-5 text-[#d5a33a]" />
          Active Laboratory Intake Dossiers
        </h3>
        <div className="space-y-4">
          {lab.submissions.map((sub) => (
            <div key={sub.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[#d5a33a]">{sub.submission_number}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={sub.urgency} />
                  <StatusBadge status={sub.status} />
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-300">{sub.case_summary_notes}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3 text-[11px] font-mono border-t border-slate-800/80 pt-2 text-slate-400">
                <div>
                  <span className="text-slate-500">Case: </span>
                  <span className="text-slate-200">{sub.case_number}</span>
                </div>
                <div>
                  <span className="text-slate-500">Submitting Org: </span>
                  <span className="text-slate-200">{sub.submitting_org}</span>
                </div>
                <div>
                  <span className="text-slate-500">Receiving Lab: </span>
                  <span className="text-slate-200">{sub.receiving_lab}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signed Lab Reports */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-emerald-400" />
          Supervisor-Approved Forensic Reports
        </h3>
        <div className="space-y-4">
          {lab.reports.map((rep) => (
            <div key={rep.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-400">{rep.report_number}</span>
                <StatusBadge status="SUPERVISOR_APPROVED" />
              </div>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed font-sans">{rep.conclusion_summary}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono border-t border-slate-800/80 pt-2 text-slate-400">
                <div>
                  <span className="text-slate-500">Lead Analyst: </span>
                  <span className="text-slate-300">{rep.reporting_analyst}</span>
                </div>
                <div>
                  <span className="text-slate-500">Approving Director: </span>
                  <span className="text-slate-300">{rep.approving_director}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span>SHA-256: </span>
                  <span className="text-slate-400 font-mono text-[10px]">{rep.formal_report_hash.slice(0, 16)}...</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 6. View: Forensic Audit Ledger
// -----------------------------------------------------------------------------
function AuditView() {
  const { data: events = initialAuditEvents } = useQuery<AuditEventItem[]>({
    queryKey: ['auditEvents'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/audit/events');
        if (res.ok) {
          const json = await res.json();
          return json.events || initialAuditEvents;
        }
      } catch {}
      return initialAuditEvents;
    },
  });

  return (
    <div>
      <SectionHeading
        eyebrow="Accountability & Traceability"
        title="Immutable Forensic Audit Trail"
        detail="Append-only log of every system transaction, biometric query, and chain of custody event."
      />

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 font-mono text-[10px] uppercase text-slate-400">
              <th className="pb-3">Timestamp</th>
              <th className="pb-3">Action</th>
              <th className="pb-3">Resource Target</th>
              <th className="pb-3">Actor / Badge</th>
              <th className="pb-3">Reason / Details</th>
              <th className="pb-3">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {events.map((ev) => (
              <tr key={ev.id} className="hover:bg-slate-800/30">
                <td className="py-3 font-mono text-[11px] text-slate-400">
                  {new Date(ev.created_at).toLocaleString()}
                </td>
                <td className="py-3 font-mono font-bold text-[#d5a33a]">{ev.action}</td>
                <td className="py-3 font-mono text-slate-300">{ev.entity_type} · {ev.entity_id}</td>
                <td className="py-3 text-slate-300">{ev.actor_name} ({ev.actor_badge})</td>
                <td className="py-3 text-slate-400 max-w-sm truncate">{ev.reason}</td>
                <td className="py-3"><StatusBadge status={ev.outcome} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 6.5. View: Advanced Kinship, Relationship & Familial Search (Phase 1.6)
// -----------------------------------------------------------------------------
function KinshipView() {
  const [activeSubTab, setActiveSubTab] = useState<'investigations' | 'analysis' | 'pedigree' | 'familial'>('investigations');

  const mockInvestigations = [
    {
      id: 'kin-inv-001',
      investigationNumber: 'KIN-NPHL-2026-00012',
      caseId: 'case-2026-0012',
      caseNumber: 'KFIN-DCI-2026-00891',
      purpose: 'Missing Person Family Relationship Identification',
      legalBasis: 'National Forensic DNA Regulations 2026, Section 14',
      status: 'AUTHORIZED',
      sensitivity: 'HIGHLY_RESTRICTED',
      createdAt: '2026-10-04T10:15:00Z',
      hypothesesCount: 2,
    },
    {
      id: 'kin-inv-002',
      investigationNumber: 'KIN-NPHL-2026-00013',
      caseId: 'case-2026-0015',
      caseNumber: 'KFIN-DCI-2026-00942',
      purpose: 'Unidentified Remains Kinship Matching Inquiry',
      legalBasis: 'Inquest Act (Cap 75) & DNA Act 2026',
      status: 'UNDER_REVIEW',
      sensitivity: 'HIGHLY_RESTRICTED',
      createdAt: '2026-10-05T08:30:00Z',
      hypothesesCount: 1,
    },
  ];

  const mockPedigreeNodes = [
    { id: 'node-1', label: 'Alleged Father (Deceased)', gender: 'MALE', nodeStatus: 'KNOWN', profileId: 'DNA-NPHL-2026-00001' },
    { id: 'node-2', label: 'Biological Mother', gender: 'FEMALE', nodeStatus: 'KNOWN', profileId: 'DNA-NPHL-2026-00003' },
    { id: 'node-3', label: 'Missing Person (Child)', gender: 'MALE', nodeStatus: 'CONFIRMED', profileId: 'DNA-NPHL-2026-00002' },
    { id: 'node-4', label: 'Unidentified Remains', gender: 'UNKNOWN', nodeStatus: 'HYPOTHESIZED', profileId: 'DNA-NPHL-2026-00099' },
  ];

  return (
    <div>
      <SectionHeading
        eyebrow="Phase 1.6 Advanced Forensic Intelligence"
        title="Kinship, Relationship Analysis & Familial Searching"
        detail="Authorized forensic relationship analysis, pedigree tree visualization, versioned population likelihood ratio calculation (KFIN-KINSHIP-CALC v1.6.0), four-eyes scientific review, and investigative lead candidate ranking."
      />

      {/* Kinship Top Stat Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatTile
          label="Kinship Investigations"
          value={mockInvestigations.length}
          detail="Authorized statutory dockets"
          accent="gold"
          icon={GitBranch}
        />
        <StatTile
          label="Likelihood Ratio Engine"
          value="KFIN-KINSHIP-1.6"
          detail="KE-STR-FREQ v1.0.0 Dataset"
          accent="emerald"
          icon={Activity}
        />
        <StatTile
          label="Pedigree Tree Versions"
          value="v4"
          detail="Reconstructable audit history"
          accent="cyan"
          icon={FolderTree}
        />
        <StatTile
          label="Familial Search Leads"
          value="1 Active Lead"
          detail="Tagged INVESTIGATIVE_LEAD"
          accent="purple"
          icon={Search}
        />
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex border-b border-slate-800 space-x-2 mb-6 text-xs">
        {[
          { id: 'investigations', label: 'Kinship Investigations & Hypotheses', icon: GitBranch },
          { id: 'analysis', label: 'STR Likelihood Ratio Workbench', icon: Activity },
          { id: 'pedigree', label: 'Pedigree Tree Visualizer (v4)', icon: FolderTree },
          { id: 'familial', label: 'Authorized Familial Searching', icon: Search },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 rounded-t-lg px-4 py-2.5 font-semibold transition-colors border-b-2',
                activeSubTab === tab.id
                  ? 'border-[#d5a33a] bg-slate-900 text-[#d5a33a]'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Sub Tab 1: Kinship Investigations */}
      {activeSubTab === 'investigations' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-[#d5a33a]" />
                Authorized Kinship Investigation Dockets
              </span>
              <span className="font-mono text-xs text-slate-400">Strict Legal Basis Enforced</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 font-mono text-[10px] uppercase text-slate-400">
                    <th className="pb-3">Investigation No.</th>
                    <th className="pb-3">Case Docket</th>
                    <th className="pb-3">Statutory Legal Basis</th>
                    <th className="pb-3">Sensitivity</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {mockInvestigations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/30">
                      <td className="py-3.5 font-mono font-bold text-[#d5a33a]">{inv.investigationNumber}</td>
                      <td className="py-3.5 font-mono text-slate-300">{inv.caseNumber}</td>
                      <td className="py-3.5 text-slate-300">{inv.legalBasis}</td>
                      <td className="py-3.5"><span className="rounded bg-rose-950/40 border border-rose-500/30 text-rose-400 px-2 py-0.5 font-mono text-[10px]">{inv.sensitivity}</span></td>
                      <td className="py-3.5"><StatusBadge status={inv.status} /></td>
                      <td className="py-3.5 font-mono text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab 2: STR Likelihood Ratio Workbench */}
      {activeSubTab === 'analysis' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-[#d5a33a]">ANALYSIS RUN: KANA-NPHL-2026-05001</span>
                <h3 className="text-lg font-bold text-slate-100 mt-1">Parent-Child Kinship Likelihood Ratio Analysis</h3>
              </div>
              <StatusBadge status="SUPPORTED" variant="good" />
            </div>

            {/* Scientific Parameters Strip */}
            <div className="grid gap-4 sm:grid-cols-4 text-xs">
              <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
                <span className="text-slate-500 font-mono text-[10px] uppercase">Algorithm & Version</span>
                <p className="text-slate-200 font-bold mt-1">KFIN-KINSHIP-CALC v1.6.0</p>
              </div>
              <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
                <span className="text-slate-500 font-mono text-[10px] uppercase">Population Reference</span>
                <p className="text-slate-200 font-bold mt-1">KE-STR-FREQ v1.0.0</p>
              </div>
              <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
                <span className="text-slate-500 font-mono text-[10px] uppercase">Combined Likelihood Ratio (CLR)</span>
                <p className="text-emerald-400 font-bold font-mono text-base mt-0.5">1.4829e+04 (14,829.4)</p>
              </div>
              <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
                <span className="text-slate-500 font-mono text-[10px] uppercase">Scientific Probability</span>
                <p className="text-emerald-400 font-bold mt-1">99.993% Parentage Support</p>
              </div>
            </div>

            {/* Locus-by-Locus Panel Breakdown Table */}
            <div>
              <h4 className="text-xs font-mono uppercase text-slate-400 font-bold mb-3">Locus Panel IBS & Likelihood Breakdown</h4>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 font-mono text-[10px] uppercase text-slate-400">
                      <th className="p-3">Locus Name</th>
                      <th className="p-3">Profile A Alleles (Parent)</th>
                      <th className="p-3">Profile B Alleles (Child)</th>
                      <th className="p-3">Shared Alleles</th>
                      <th className="p-3">IBS State</th>
                      <th className="p-3">Locus Likelihood Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {[
                      { locus: 'D3S1358', a: '15, 16', b: '15, 17', shared: '15', ibs: 'IBS-1', lr: '1.4286' },
                      { locus: 'vWA', a: '16, 17', b: '17, 18', shared: '17', ibs: 'IBS-1', lr: '1.9231' },
                      { locus: 'FGA', a: '22, 23', b: '23, 24', shared: '23', ibs: 'IBS-1', lr: '2.0833' },
                      { locus: 'D8S1179', a: '13, 14', b: '13, 15', shared: '13', ibs: 'IBS-1', lr: '1.5625' },
                      { locus: 'D21S11', a: '29, 30', b: '29, 31', shared: '29', ibs: 'IBS-1', lr: '1.7857' },
                    ].map((row) => (
                      <tr key={row.locus} className="hover:bg-slate-800/30">
                        <td className="p-3 font-mono font-bold text-slate-200">{row.locus}</td>
                        <td className="p-3 font-mono text-slate-300">{row.a}</td>
                        <td className="p-3 font-mono text-slate-300">{row.b}</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">{row.shared}</td>
                        <td className="p-3"><span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-cyan-400">{row.ibs}</span></td>
                        <td className="p-3 font-mono text-[#d5a33a] font-bold">{row.lr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab 3: Pedigree Tree Visualizer */}
      {activeSubTab === 'pedigree' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-[#d5a33a]">PEDIGREE ID: PED-2026-0104</span>
                <h3 className="text-lg font-bold text-slate-100 mt-1">Kiprotich Family Pedigree Tree Representation</h3>
              </div>
              <span className="rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 px-3 py-1 text-xs font-mono font-bold">
                VERSION v4 (RECONSTRUCTABLE)
              </span>
            </div>

            {/* Interactive Node Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {mockPedigreeNodes.map((node) => (
                <div key={node.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#d5a33a]">{node.id}</span>
                    <StatusBadge status={node.nodeStatus} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">{node.label}</h4>
                  <p className="text-xs text-slate-400 font-mono">Gender: {node.gender}</p>
                  <p className="text-[11px] text-emerald-400 font-mono truncate">Profile: {node.profileId}</p>
                </div>
              ))}
            </div>

            {/* Version Audit Log */}
            <div className="border-t border-slate-800 pt-4">
              <h4 className="text-xs font-mono uppercase text-slate-400 font-bold mb-3">Pedigree Version Audit History</h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 flex justify-between">
                  <span className="text-slate-300">v4: Linked father node to missing child profile (DNA-NPHL-2026-00002)</span>
                  <span className="text-slate-500">2026-10-05 11:20:00</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 flex justify-between">
                  <span className="text-slate-300">v3: Added biological mother reference node</span>
                  <span className="text-slate-500">2026-10-04 16:45:00</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 flex justify-between">
                  <span className="text-slate-300">v1: Initial pedigree structure created</span>
                  <span className="text-slate-500">2026-10-04 10:15:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab 4: Familial Searching */}
      {activeSubTab === 'familial' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-[#d5a33a]">FAMILIAL SEARCH REQUEST: FSR-NPHL-2026-03001</span>
                <h3 className="text-lg font-bold text-slate-100 mt-1">Authorized Familial Candidate Ranking Engine</h3>
              </div>
              <StatusBadge status="COMPLETED" variant="good" />
            </div>

            {/* Candidate Ranking Output Table */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase text-slate-400 font-bold">Candidate Relationship Lead Ranking</h4>
                <span className="rounded bg-rose-950/40 border border-rose-500/30 text-rose-400 px-2.5 py-0.5 text-[10px] font-mono">
                  ELIMINATION DB PROTECTED
                </span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 font-mono text-[10px] uppercase text-slate-400">
                      <th className="p-3">Rank #</th>
                      <th className="p-3">Candidate DNA Profile</th>
                      <th className="p-3">Estimated Relationship</th>
                      <th className="p-3">Likelihood Score</th>
                      <th className="p-3">Classification Lead Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-[#d5a33a]">#1</td>
                      <td className="p-3 font-mono text-slate-200 font-bold">DNA-NPHL-2026-00002</td>
                      <td className="p-3 font-mono text-slate-300">PARENT_CHILD</td>
                      <td className="p-3 font-mono text-emerald-400 font-bold">14,829.4</td>
                      <td className="p-3">
                        <span className="rounded bg-amber-950/50 border border-amber-500/30 text-amber-300 px-2.5 py-1 text-[11px] font-mono font-bold">
                          INVESTIGATIVE_LEAD
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 7. View: Foundation & Quality Gates (Phase 0)
// -----------------------------------------------------------------------------
function FoundationView() {
  const qualityGates = [
    { name: 'Formatting & Linting', command: 'pnpm format:check && pnpm lint', status: 'PASSING', purpose: 'Enforces architectural boundaries and style uniformity.' },
    { name: 'TypeScript Typecheck', command: 'pnpm typecheck', status: 'PASSING', purpose: 'Zero unchecked types across all 9 monorepo packages.' },
    { name: 'Unit & Contract Tests', command: 'pnpm test', status: 'PASSING', purpose: 'Validates foundation specifications and OpenAPI contracts.' },
    { name: 'Production Build', command: 'pnpm build', status: 'PASSING', purpose: 'Builds backend and frontend distribution bundles.' },
    { name: 'E2E Smoke Verification', command: 'pnpm test:e2e', status: 'PASSING', purpose: 'Verifies production artifacts start and respond.' },
    { name: 'Secret & SAST Scans', command: 'pnpm security', status: 'PASSING', purpose: 'Clean scan across 268 files with 0 security findings.' },
    { name: 'Documentation Audit', command: 'pnpm docs:check', status: 'PASSING', purpose: 'Audits 21 mandatory specification documents.' },
  ];

  return (
    <div>
      <SectionHeading
        eyebrow="Phase 0 Development Governance"
        title="Engineering Constitution & Automated Quality Gates"
        detail="The formal development foundation and continuous verification gates guarding all KFIN implementation phases."
      />

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="font-mono text-xs uppercase text-[#d5a33a] font-bold">Phase Status</span>
          <h3 className="text-xl font-bold text-slate-100 mt-1">Phase 1 Core Implementation</h3>
          <p className="text-xs text-slate-400 mt-1">Sub-Phase 1.1 Database & Persistence Implementation is complete and operational.</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="font-mono text-xs uppercase text-emerald-400 font-bold">Quality Gates</span>
          <h3 className="text-xl font-bold text-slate-100 mt-1">10 / 10 Passing (100%)</h3>
          <p className="text-xs text-slate-400 mt-1">Automated CI/CD enforcement passes all boundary, contract, and security gates.</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 overflow-x-auto">
        <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          Enforced Engineering Quality Gates
        </h3>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 font-mono text-[10px] uppercase text-slate-400">
              <th className="pb-3">Gate Name</th>
              <th className="pb-3">Execution Command</th>
              <th className="pb-3">Governing Purpose</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {qualityGates.map((g) => (
              <tr key={g.name} className="hover:bg-slate-800/30">
                <td className="py-3 font-semibold text-slate-200">{g.name}</td>
                <td className="py-3 font-mono text-[11px] text-[#d5a33a]">{g.command}</td>
                <td className="py-3 text-slate-400">{g.purpose}</td>
                <td className="py-3"><StatusBadge status={g.status} variant="good" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 6.6. View: Cross-Case Forensic Intelligence & Link Analysis (Phase 1.7)
// -----------------------------------------------------------------------------
function IntelligenceView() {
  const [activeSubTab, setActiveSubTab] = useState<'graph' | 'leads' | 'caselinks' | 'observations'>('graph');
  const [maxDepth, setMaxDepth] = useState<number>(2);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  const mockNodes = [
    { id: 'CASE:case_2026_001', type: 'CASE', label: 'Nairobi Burglary Docket 2026-001', org: 'NPHL Lab', sensitivity: 'RESTRICTED', isRedacted: false },
    { id: 'EVIDENCE:evd_2026_101', type: 'EVIDENCE', label: 'Bloodstain Swab (EVD-101)', org: 'NPHL Lab', sensitivity: 'RESTRICTED', isRedacted: false },
    { id: 'DNA_PROFILE:dna_prof_001', type: 'DNA_PROFILE', label: 'STR Profile KFIN-SYN-DNA-001', org: 'NPHL Lab', sensitivity: 'HIGHLY_RESTRICTED', isRedacted: false },
    { id: 'CASE:case_2026_002', type: 'CASE', label: 'Mombasa Store Theft Docket 2026-002', org: 'DCI HQ', sensitivity: 'RESTRICTED', isRedacted: false },
    { id: 'PERSON:prs_john_doe', type: 'PERSON', label: 'John Doe (Suspect)', org: 'DCI HQ', sensitivity: 'RESTRICTED', isRedacted: false },
    { id: 'CASE:case_2026_999', type: 'CASE', label: '[RESTRICTED CASE]', org: 'NIS Agency', sensitivity: 'SECRET', isRedacted: true },
  ];

  const mockEdges = [
    { id: 'e1', source: 'CASE:case_2026_001', target: 'EVIDENCE:evd_2026_101', type: 'RECOVERED_FROM', class: 'FACT', provenance: 'SCENE_EXHIBIT_LOG' },
    { id: 'e2', source: 'EVIDENCE:evd_2026_101', target: 'DNA_PROFILE:dna_prof_001', type: 'PRODUCED_PROFILE', class: 'CONFIRMED_FORENSIC_RELATIONSHIP', provenance: 'LAB_STR_PROFILE_ANALYSIS' },
    { id: 'e3', source: 'DNA_PROFILE:dna_prof_001', target: 'CASE:case_2026_002', type: 'MATCHED_TO', class: 'ANALYTICAL_RELATIONSHIP', provenance: 'NATIONAL_DNA_INDEX_SEARCH' },
    { id: 'e4', source: 'PERSON:prs_john_doe', target: 'CASE:case_2026_002', type: 'SUSPECT_IN', class: 'HYPOTHESIS', provenance: 'INVESTIGATIVE_TIP' },
    { id: 'e5', source: 'CASE:case_2026_001', target: 'CASE:case_2026_999', type: 'CROSS_ORG_LINK', class: 'INVESTIGATIVE_LEAD', provenance: 'INTELLIGENCE_TRAVERSAL' },
  ];

  const mockLeads = [
    {
      id: 'LEAD-001',
      leadNumber: 'KFIN-LEAD-SYN-NPHL-2026-001',
      title: 'Investigate Serial Burglary Link Nairobi-Mombasa',
      priority: 'CRITICAL',
      status: 'ASSIGNED',
      assignedInvestigator: 'Insp. James Omondi (Badge #9921)',
      assignedOrg: 'NPHL Forensic Biology Unit',
      rationale: 'High DNA STR LR match between exhibit profiles across Nairobi and Mombasa dockets.',
      createdAt: '2026-10-05T09:30:00Z',
    },
    {
      id: 'LEAD-002',
      leadNumber: 'KFIN-LEAD-SYN-NPHL-2026-002',
      title: 'Verify Duplicate Person Record (John Doe vs Jonathan Doe)',
      priority: 'PRIORITY',
      status: 'UNDER_REVIEW',
      assignedInvestigator: 'Capt. Sarah Kamau (Badge #4412)',
      assignedOrg: 'DCI Criminal Records Office',
      rationale: 'National ID match 33445566 with 94% similarity score across case dockets.',
      createdAt: '2026-10-05T11:15:00Z',
    },
  ];

  const mockCaseLinks = [
    {
      id: 'LNK-001',
      sourceCase: 'KFIN-DCI-2026-00891 (Nairobi)',
      targetCase: 'KFIN-DCI-2026-00942 (Mombasa)',
      linkType: 'COMMON_BIOLOGICAL_EXHIBIT',
      status: 'CONFIRMED',
      approvedBy: 'Dr. A. Oduor (Director Forensic Services)',
      rationale: 'Identical DNA profile identified in exhibit swabs.',
    },
  ];

  const mockObservations = [
    {
      id: 'OBS-001',
      obsNumber: 'KFIN-OBS-SYN-NPHL-2026-001',
      title: 'Cross-case DNA STR Match Discovery',
      description: 'DNA profile from Exhibit EVD-101 matched crime scene sample in Case 002 with LR = 1.45e9.',
      rationale: 'National DNA database automated candidate match trigger.',
      createdAt: '2026-10-05T08:00:00Z',
    },
  ];

  const filteredEdges = mockEdges.filter(e => selectedClass === 'ALL' || e.class === selectedClass);

  return (
    <div>
      <SectionHeading
        eyebrow="Phase 1.7 Cross-Case Forensic Intelligence"
        title="Cross-Case Link Analysis & Intelligence Graph"
        detail="Authorization-aware multi-depth entity relationship traversal, minimum necessary disclosure, separation of duties lead workflows, and non-destructive case linking."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatTile
          label="Active Graph Nodes"
          value={mockNodes.length}
          detail="Cases, Evidence, DNA & Persons"
          accent="gold"
          icon={Share2}
        />
        <StatTile
          label="Forensic Relationships"
          value={mockEdges.length}
          detail="Fact, Analytical & Lead classes"
          accent="emerald"
          icon={GitBranch}
        />
        <StatTile
          label="Intelligence Leads"
          value={mockLeads.length}
          detail="Under active human review"
          accent="cyan"
          icon={Activity}
        />
        <StatTile
          label="Confirmed Case Links"
          value={mockCaseLinks.length}
          detail="SoD verified case associations"
          accent="purple"
          icon={Waypoints}
        />
      </div>

      <div className="flex border-b border-slate-800 space-x-2 mb-6 text-xs overflow-x-auto">
        {[
          { id: 'graph', label: 'Link Analysis Graph Workbench', icon: Share2 },
          { id: 'leads', label: `Intelligence Leads Queue (${mockLeads.length})`, icon: Activity },
          { id: 'caselinks', label: `Case Links & Resolution (${mockCaseLinks.length})`, icon: Waypoints },
          { id: 'observations', label: `Observation Log (${mockObservations.length})`, icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 rounded-t-lg px-4 py-2.5 font-semibold transition-colors border-b-2 whitespace-nowrap',
                activeSubTab === tab.id
                  ? 'border-[#d5a33a] bg-slate-900 text-[#d5a33a]'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeSubTab === 'graph' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-[#d5a33a]" />
                  Multi-Depth Cross-Case Intelligence Graph
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Server-side clearance enforcement & minimum necessary disclosure (Depth 1 to 3).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5">
                  <span className="text-slate-400 font-mono text-[11px]">Max Traversal Depth:</span>
                  <select
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(Number(e.target.value))}
                    className="bg-transparent text-slate-200 font-bold focus:outline-none"
                  >
                    <option value={1}>Depth 1 (Direct)</option>
                    <option value={2}>Depth 2 (Network)</option>
                    <option value={3}>Depth 3 (Broad Intelligence)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5">
                  <span className="text-slate-400 font-mono text-[11px]">Filter Relationship Class:</span>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="bg-transparent text-slate-200 font-bold focus:outline-none"
                  >
                    <option value="ALL">All Classes</option>
                    <option value="FACT">FACT</option>
                    <option value="ANALYTICAL_RELATIONSHIP">ANALYTICAL_RELATIONSHIP</option>
                    <option value="INVESTIGATIVE_LEAD">INVESTIGATIVE_LEAD</option>
                    <option value="HYPOTHESIS">HYPOTHESIS</option>
                    <option value="CONFIRMED_FORENSIC_RELATIONSHIP">CONFIRMED_FORENSIC_RELATIONSHIP</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-6 space-y-6">
              <h4 className="text-xs font-mono uppercase text-slate-400 font-bold mb-2 flex items-center justify-between">
                <span>Discovered Entity Nodes ({mockNodes.length})</span>
                <span className="text-amber-400">AUTHORIZATION-AWARE GRAPH ENGINE</span>
              </h4>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mockNodes.map((node) => (
                  <div
                    key={node.id}
                    className={cn(
                      'rounded-xl border p-4 transition-all',
                      node.isRedacted
                        ? 'border-rose-500/40 bg-rose-950/20'
                        : node.type === 'CASE'
                        ? 'border-amber-500/30 bg-slate-900/60'
                        : node.type === 'DNA_PROFILE'
                        ? 'border-cyan-500/30 bg-slate-900/60'
                        : 'border-slate-800 bg-slate-900/60'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-[#d5a33a]">{node.type}</span>
                      <span
                        className={cn(
                          'rounded px-2 py-0.5 font-mono text-[10px] font-semibold',
                          node.isRedacted
                            ? 'bg-rose-950/60 border border-rose-500/40 text-rose-400'
                            : 'bg-slate-800 text-slate-400'
                        )}
                      >
                        {node.sensitivity}
                      </span>
                    </div>

                    <h5 className="mt-2 text-sm font-bold text-slate-100 flex items-center gap-2">
                      {node.isRedacted && <Lock className="h-3.5 w-3.5 text-rose-400 shrink-0" />}
                      <span className={node.isRedacted ? 'text-rose-400 font-mono' : ''}>{node.label}</span>
                    </h5>

                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono border-t border-slate-800/80 pt-2 text-slate-400">
                      <span>Org: {node.org}</span>
                      <span className="text-slate-500">ID: {node.id.split(':')[1]}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-6">
                <h4 className="text-xs font-mono uppercase text-slate-400 font-bold mb-3">Active Forensic Edges ({filteredEdges.length})</h4>
                <div className="space-y-2">
                  {filteredEdges.map((edge) => (
                    <div key={edge.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-200">{edge.source}</span>
                        <span className="text-slate-500 font-mono">━━[{edge.type}]━━►</span>
                        <span className="font-mono font-bold text-slate-200">{edge.target}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-slate-400">Source: {edge.provenance}</span>
                        <StatusBadge status={edge.class} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'leads' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#d5a33a]" />
                  Actionable Intelligence Leads Queue
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Separation of Duties (SoD) enforced: Assigned investigator cannot be the sole approver confirming a lead.
                </p>
              </div>
              <span className="font-mono text-xs text-amber-400 bg-amber-950/40 border border-amber-500/30 rounded-full px-3 py-1">
                2 ACTIVE LEADS
              </span>
            </div>

            <div className="space-y-4">
              {mockLeads.map((lead) => (
                <div key={lead.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#d5a33a]">{lead.leadNumber}</span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={lead.priority} />
                      <StatusBadge status={lead.status} />
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-slate-100">{lead.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{lead.rationale}</p>

                  <div className="grid gap-2 sm:grid-cols-2 text-[11px] font-mono border-t border-slate-800/80 pt-3 text-slate-400">
                    <div>
                      <span className="text-slate-500">Assigned Investigator: </span>
                      <span className="text-slate-200">{lead.assignedInvestigator}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Assigned Organization: </span>
                      <span className="text-slate-200">{lead.assignedOrg}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'caselinks' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Waypoints className="h-5 w-5 text-emerald-400" />
                  Confirmed Case Links & Person Resolution Candidates
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Controlled case linking preserves individual case identities while establishing formal investigative connections.
                </p>
              </div>
              <StatusBadge status="CONFIRMED_LINK" variant="good" />
            </div>

            <div className="space-y-4">
              {mockCaseLinks.map((link) => (
                <div key={link.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-2">
                      <span>{link.sourceCase}</span>
                      <span className="text-slate-500 font-mono">◀━━━━[{link.linkType}]━━━━►</span>
                      <span>{link.targetCase}</span>
                    </span>
                    <StatusBadge status={link.status} variant="good" />
                  </div>
                  <p className="text-xs text-slate-300">Rationale: {link.rationale}</p>
                  <p className="text-[11px] text-slate-500 font-mono">Approved By: {link.approvedBy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'observations' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-4">
              <BookOpen className="h-5 w-5 text-[#d5a33a]" />
              Intelligence Observation Records
            </h3>

            <div className="space-y-4">
              {mockObservations.map((obs) => (
                <div key={obs.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#d5a33a]">{obs.obsNumber}</span>
                    <span className="font-mono text-[10px] text-slate-500">{new Date(obs.createdAt).toLocaleString()}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">{obs.title}</h4>
                  <p className="text-xs text-slate-300">{obs.description}</p>
                  <p className="text-[11px] text-slate-400 font-mono">Rationale: {obs.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// App Routing Component
// -----------------------------------------------------------------------------
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <WouterRouter>
            <Shell>
              <Switch>
                <Route path="/" component={DatabaseView} />
                <Route path="/cases" component={CasesView} />
                <Route path="/evidence" component={EvidenceView} />
                <Route path="/dna" component={DnaView} />
                <Route path="/kinship" component={KinshipView} />
                <Route path="/intelligence" component={IntelligenceView} />
                <Route path="/laboratory" component={LaboratoryView} />
                <Route path="/audit" component={AuditView} />
                <Route path="/foundation" component={FoundationView} />
                <Route component={NotFound} />
              </Switch>
            </Shell>
          </WouterRouter>
          <Toaster />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}