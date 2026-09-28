import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getHealthCheckQueryKey, useHealthCheck } from '@workspace/api-client-react';
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  ClipboardCheck,
  Code2,
  FileClock,
  FileText,
  FolderTree,
  Gauge,
  GitBranch,
  Landmark,
  LockKeyhole,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  ShieldCheck,
  Timer,
  Waypoints,
  X,
} from 'lucide-react';
import {
  Link,
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type PhaseStatus = {
  phase: string;
  status: 'Established' | 'In progress' | 'Gated';
  gate: string;
  description: string;
};

type SubPhase = {
  id: string;
  name: string;
  status: 'Established' | 'Gated' | 'Queued';
  objective: string;
  evidence: string;
};

type QualityGate = {
  name: string;
  status: 'Passing' | 'Required' | 'Ready';
  command: string;
  purpose: string;
};

type DeferredItem = {
  domain: string;
  reason: string;
  unlock: string;
};

const phases: PhaseStatus[] = [
  {
    phase: 'Phase 0',
    status: 'Established',
    gate: 'Final reconciliation',
    description: 'Development foundation, engineering constitution, repository control and quality governance.',
  },
  {
    phase: '0.1',
    status: 'Established',
    gate: 'Acceptance recorded',
    description: 'Rules governing architecture, engineering conduct, security, documentation and change.',
  },
  {
    phase: '0.2',
    status: 'Established',
    gate: 'Acceptance recorded',
    description: 'Controlled repository boundaries, application shell and reproducible development foundation.',
  },
  {
    phase: '0.3',
    status: 'Established',
    gate: 'Acceptance recorded',
    description: 'Quality gates preventing unverified code from progressing through the project.',
  },
];

const subPhases: SubPhase[] = [
  { id: '0.1', name: 'Development constitution', status: 'Established', objective: 'Make authority and engineering rules explicit before implementation.', evidence: 'KFIN-ADR-001 · constitution.md' },
  { id: '0.2', name: 'Repository & monorepo foundation', status: 'Established', objective: 'Create reproducible, bounded surfaces for future KFIN work.', evidence: 'repository-map.md · package boundaries' },
  { id: '0.3', name: 'Engineering quality gates', status: 'Established', objective: 'Verify formatting, types, tests, builds and security controls.', evidence: 'pnpm quality:ci · 5/5 quality gates passing' },
];

const qualityGates: QualityGate[] = [
  { name: 'Type safety', status: 'Passing', command: 'pnpm typecheck', purpose: 'No unchecked contracts cross a package boundary.' },
  { name: 'Build verification', status: 'Passing', command: 'pnpm build', purpose: 'Production bundles remain reproducible and deployable.' },
  { name: 'Static analysis', status: 'Passing', command: 'pnpm format:check', purpose: 'Code formatting and style rules verified.' },
  { name: 'Test verification', status: 'Passing', command: 'pnpm test', purpose: 'Behaviour is evidenced before a change can be accepted.' },
  { name: 'Dependency & secret scan', status: 'Passing', command: 'pnpm quality:ci', purpose: 'Supply-chain and accidental disclosure risks are surfaced.' },
];

const deferredItems: DeferredItem[] = [
  { domain: 'Case management', reason: 'Operational workflows are outside the Phase 0 foundation boundary.', unlock: 'Phase 1 domain mandate' },
  { domain: 'Evidence & chain of custody', reason: 'Forensic records require approved domain models and integrity controls first.', unlock: 'Evidence domain specification' },
  { domain: 'DNA & laboratory', reason: 'No profiles, specimens, matching or examination flows are to be simulated.', unlock: 'DNA implementation phase' },
  { domain: 'Intelligence analysis', reason: 'Analytical conclusions cannot be represented by a foundation console.', unlock: 'Intelligence domain gate' },
  { domain: 'Institutional integrations', reason: 'No production exchange, federation or national identity integration exists in Phase 0.', unlock: 'Approved interoperability plan' },
  { domain: 'Forensic AI', reason: 'Automated conclusions and decisions are explicitly deferred.', unlock: 'AI governance approval' },
];

const navItems = [
  { href: '/', label: 'Overview', caption: 'Phase 0 posture', icon: Gauge },
  { href: '/governance', label: 'Governance', caption: 'Authority & change', icon: Landmark },
  { href: '/repository', label: 'Repository', caption: 'Development foundation', icon: FolderTree },
  { href: '/quality', label: 'Quality', caption: 'Verification evidence', icon: ShieldCheck },
  { href: '/traceability', label: 'Traceability', caption: 'Requirements & deferrals', icon: Waypoints },
];

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function StatusChip({
  status,
  testId,
}: {
  status: PhaseStatus['status'] | QualityGate['status'] | SubPhase['status'];
  testId: string;
}) {
  const isGood = status === 'Established' || status === 'Passing';
  const isAlert = status === 'Gated' || status === 'Required';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em]',
        isGood && 'border-[#9cc7b0] bg-[#e9f4ed] text-[#286344]',
        isAlert && 'border-[#e6b4a8] bg-[#f9ece8] text-[#a33d2e]',
        !isGood && !isAlert && 'border-[#dbca83] bg-[#fbf4d9] text-[#79621b]',
      )}
      data-testid={testId}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
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
    <div className="mb-7 flex flex-col gap-4 border-b border-[#ddd6c7] pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[#aa7925]" data-testid={`text-eyebrow-${eyebrow.toLowerCase().replaceAll(' ', '-')}`}>
          {eyebrow}
        </p>
        <h1 className="font-[var(--app-font-serif)] text-3xl font-semibold tracking-[-0.035em] text-[#1c2b3f] md:text-[2.65rem]" data-testid={`heading-${title.toLowerCase().replaceAll(' ', '-')}`}>
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667181]" data-testid={`text-detail-${eyebrow.toLowerCase().replaceAll(' ', '-')}`}>
          {detail}
        </p>
      </div>
      {action}
    </div>
  );
}

function StatTile({
  label,
  value,
  detail,
  accent = 'gold',
  testId,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: 'gold' | 'green' | 'red' | 'blue';
  testId: string;
}) {
  const accentClass = { gold: 'border-t-[#c9942e]', green: 'border-t-[#4d8c68]', red: 'border-t-[#b54d3c]', blue: 'border-t-[#526f9b]' }[accent];
  return (
    <div className={cn('rounded-xl border border-[#ddd6c7] border-t-[3px] bg-[#fffdf8] p-5 shadow-[0_5px_20px_rgba(31,45,65,0.04)] transition-transform duration-200 hover:-translate-y-0.5', accentClass)}>
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#858d96]" data-testid={`label-${testId}`}>{label}</p>
      <p className="mt-3 font-[var(--app-font-serif)] text-3xl font-semibold tracking-[-0.05em] text-[#1c2b3f]" data-testid={`value-${testId}`}>{value}</p>
      <p className="mt-1.5 text-xs leading-5 text-[#707985]" data-testid={`detail-${testId}`}>{detail}</p>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), retry: 1 } });
  const healthStatus = health.data?.status ?? '';
  const healthIsGood = healthStatus.toLowerCase() === 'ok' || healthStatus.toLowerCase() === 'healthy';

  return (
    <div className="min-h-[100dvh] bg-[#f5f1e8] text-[#1c2b3f]">
      {sidebarOpen && <button className="fixed inset-0 z-30 bg-[#162337]/35 md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" data-testid="button-close-navigation-overlay" />}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[276px] flex-col border-r border-[#314158] bg-[#1c2b3f] text-[#e9e6dc] transition-transform duration-300 md:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        sidebarCollapsed && 'md:w-[84px]',
      )}>
        <div className={cn('flex h-[86px] items-center border-b border-[#314158] px-6', sidebarCollapsed && 'md:justify-center md:px-2')}>
          <Link href="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)} data-testid="link-brand-home">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#d5a33a] text-[#1c2b3f] shadow-[3px_3px_0_#8d6722]">
              <span className="font-[var(--app-font-serif)] text-lg font-bold">K</span>
            </span>
            <span className={cn('leading-tight', sidebarCollapsed && 'md:hidden')}>
              <span className="block font-[var(--app-font-serif)] text-[17px] font-semibold tracking-[-0.03em]">KFIN</span>
              <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.17em] text-[#aeb8c2]">Foundation console</span>
            </span>
          </Link>
          <button className="ml-auto rounded-md p-1.5 text-[#aeb8c2] transition-colors hover:bg-[#2b3a50] hover:text-[#f5f1e8] md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" data-testid="button-close-navigation">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={cn('px-4 py-6', sidebarCollapsed && 'md:px-2')}>
          <p className={cn('mb-3 px-2 font-mono text-[9px] uppercase tracking-[0.19em] text-[#718094]', sidebarCollapsed && 'md:hidden')}>Control surfaces</p>
          <nav className="space-y-1" aria-label="Primary navigation">
            {navItems.map((item) => {
              const active = location === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg border px-3 py-3 transition-all duration-200',
                    active ? 'border-[#4c5e74] bg-[#2b3a50] text-[#f6d98e]' : 'border-transparent text-[#b4bec9] hover:border-[#34465d] hover:bg-[#26364a] hover:text-[#f2eee4]',
                    sidebarCollapsed && 'md:justify-center md:px-2',
                  )}
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  <Icon className={cn('h-[17px] w-[17px] shrink-0', active ? 'text-[#d5a33a]' : 'text-[#7f91a4] group-hover:text-[#d5a33a]')} />
                  <span className={cn('min-w-0', sidebarCollapsed && 'md:hidden')}>
                    <span className="block text-[13px] font-medium">{item.label}</span>
                    <span className="mt-0.5 block truncate font-mono text-[9px] tracking-[0.02em] text-[#7c8a9a]">{item.caption}</span>
                  </span>
                  {active && <span className={cn('ml-auto h-1.5 w-1.5 rounded-full bg-[#d5a33a]', sidebarCollapsed && 'md:hidden')} />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={cn('mt-auto border-t border-[#314158] p-4', sidebarCollapsed && 'md:px-2')}>
          <div className={cn('rounded-lg border border-[#314158] bg-[#202f43] p-3', sidebarCollapsed && 'md:border-transparent md:bg-transparent md:p-1')}>
            <div className={cn('flex items-center gap-2.5', sidebarCollapsed && 'md:justify-center')}>
              <span className={cn('h-2 w-2 rounded-full', health.isLoading ? 'animate-pulse bg-[#d5a33a]' : healthIsGood ? 'bg-[#71b48b]' : 'bg-[#94a3b8]')} />
              <span className={cn('font-mono text-[10px] uppercase tracking-[0.12em] text-[#b9c3ce]', sidebarCollapsed && 'md:hidden')}>Foundation health</span>
            </div>
            <p className={cn('mt-2 text-[11px] leading-4 text-[#7d8b9d]', sidebarCollapsed && 'md:hidden')} data-testid="status-foundation-health">
              {health.isLoading ? 'Checking API surface…' : healthIsGood ? `Connected · ${healthStatus}` : 'Standby · start api-server (:5000)'}
            </p>
            {!healthIsGood && !health.isLoading && <button className={cn('mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#f0c86d] underline underline-offset-2', sidebarCollapsed && 'md:hidden')} onClick={() => health.refetch()} data-testid="button-retry-health">Check health</button>}
          </div>
          <div className={cn('mt-4 flex items-center gap-2 text-[#7d8b9d]', sidebarCollapsed && 'md:justify-center')}>
            <LockKeyhole className="h-3.5 w-3.5" />
            <span className={cn('font-mono text-[9px] uppercase tracking-[0.13em]', sidebarCollapsed && 'md:hidden')}>Authorized reviewers only</span>
          </div>
        </div>
        <button
          className="absolute -right-3 top-[99px] hidden h-6 w-6 place-items-center rounded-full border border-[#526379] bg-[#1c2b3f] text-[#ccd3db] shadow-sm md:grid"
          onClick={() => setSidebarCollapsed((value) => !value)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          data-testid="button-toggle-sidebar"
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
      </aside>

      <div className={cn('min-h-[100dvh] transition-[padding] duration-300 md:pl-[276px]', sidebarCollapsed && 'md:pl-[84px]')}>
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-[#ddd6c7] bg-[#f5f1e8]/90 px-5 backdrop-blur-md md:px-10">
          <div className="flex items-center gap-3">
            <button className="rounded-lg border border-[#ddd6c7] bg-[#fffdf8] p-2 text-[#526070] md:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation" data-testid="button-open-navigation">
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 text-[#78818b] md:flex">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em]">KFIN /</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#1c2b3f]">{navItems.find((item) => item.href === location)?.label ?? 'Overview'}</span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#78818b] md:hidden">KFIN / {navItems.find((item) => item.href === location)?.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 border-r border-[#ddd6c7] pr-4 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4d8c68]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-[#687381]" data-testid="status-console-mode">Read-only posture</span>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#2f6d59] font-mono text-[11px] font-medium text-[#f6f0e1]" data-testid="avatar-reviewer">RG</span>
          </div>
        </header>
        <main className="console-grid min-h-[calc(100dvh-70px)] px-5 py-8 md:px-10 md:py-11">
          {children}
        </main>
      </div>
    </div>
  );
}

function OverviewPage() {
  const [expanded, setExpanded] = useState<string | null>('0.1');
  const [location, setLocation] = useLocation();
  const completed = phases.filter((phase) => phase.status === 'Established').length;
  return (
    <div className="mx-auto max-w-[1360px] animate-rise-in">
      <SectionHeading eyebrow="Phase 0 / Acceptance posture" title="A foundation under review." detail="The console makes the boundary visible: what has been established, what remains gated, and what cannot be built yet." action={<button onClick={() => setLocation('/quality')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1c2b3f] px-4 py-2.5 text-xs font-semibold text-[#f5f1e8] shadow-[3px_3px_0_#d5a33a] transition-transform hover:-translate-y-0.5" data-testid="button-review-quality">Review quality evidence <ArrowUpRight className="h-3.5 w-3.5" /></button>} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Phase completion" value={`${completed} / ${phases.length}`} detail="Sub-phases accepted to date" accent="green" testId="phase-completion" />
        <StatTile label="Current gate" value="0.3" detail="Quality evidence verified" accent="green" testId="current-gate" />
        <StatTile label="Quality checks" value="5 / 5" detail="Passing in the foundation" accent="green" testId="quality-checks" />
        <StatTile label="Operational domains" value="0" detail="Intentionally implemented" accent="blue" testId="operational-domains" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="rounded-xl border border-[#ddd6c7] bg-[#fffdf8] p-5 shadow-[0_5px_20px_rgba(31,45,65,0.04)] md:p-7">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2"><Activity className="h-4 w-4 text-[#aa7925]" /><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#aa7925]">Sequential control</p></div>
              <h2 className="font-[var(--app-font-serif)] text-xl font-semibold tracking-[-0.03em]">Phase path to acceptance</h2>
              <p className="mt-1 text-xs text-[#727b86]">A later gate cannot be treated as complete before its dependency is accepted.</p>
            </div>
            <span className="hidden rounded-md bg-[#f4eddb] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#866b25] sm:block" data-testid="status-sequential-mode">Sequential</span>
          </div>
          <div className="relative space-y-1">
            <div className="absolute bottom-7 left-[15px] top-7 w-px bg-[#ddd6c7]" aria-hidden="true" />
            {phases.slice(1).map((phase, index) => (
              <div key={phase.phase} className="relative flex gap-4 rounded-lg p-3 transition-colors hover:bg-[#faf6eb]" data-testid={`row-phase-${phase.phase.replace('.', '-')}`}>
                <div className={cn('z-10 mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border-4 border-[#fffdf8] text-[11px] font-bold', phase.status === 'Established' ? 'bg-[#4d8c68] text-white' : phase.status === 'Gated' ? 'bg-[#b54d3c] text-white' : 'bg-[#d5a33a] text-[#1c2b3f]')}>
                  {phase.status === 'Established' ? <Check className="h-3.5 w-3.5" /> : `0.${index + 1}`}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[#27384b]" data-testid={`text-phase-name-${phase.phase.replace('.', '-')}`}>{phase.phase} <span className="font-normal text-[#7b8490]">· {phase.description.split(',')[0]}</span></h3>
                    <StatusChip status={phase.status} testId={`status-phase-${phase.phase.replace('.', '-')}`} />
                  </div>
                  <p className="mt-1.5 text-xs text-[#79828d]" data-testid={`text-gate-${phase.phase.replace('.', '-')}`}>Gate: {phase.gate}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#1c2b3f] bg-[#1c2b3f] p-5 text-[#e9e6dc] shadow-[0_8px_24px_rgba(28,43,63,0.12)] md:p-7">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#d5a33a]">Boundary statement</p>
            <LockKeyhole className="h-4 w-4 text-[#d5a33a]" />
          </div>
          <blockquote className="mt-8 font-[var(--app-font-serif)] text-[1.65rem] font-medium leading-[1.15] tracking-[-0.04em] text-[#f6f0e1]" data-testid="text-boundary-statement">
            “This is a controlled development platform, not a prototype masquerading as a national forensic system.”
          </blockquote>
          <div className="mt-8 border-t border-[#3a4b61] pt-5">
            <p className="text-xs leading-5 text-[#abb5c0]">Phase 0 recognises future forensic obligations without simulating operational capability.</p>
            <Link href="/traceability" className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#f0c86d] underline decoration-[#6f5b2c] underline-offset-4 transition-colors hover:text-[#fff1bb]" data-testid="link-view-deferred-scope">View deferred scope <ArrowUpRight className="h-3 w-3" /></Link>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-[#ddd6c7] bg-[#fffdf8] p-5 md:p-7">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#aa7925]">Sub-phase register</p>
            <h2 className="mt-2 font-[var(--app-font-serif)] text-xl font-semibold tracking-[-0.03em]">Evidence, not appearance.</h2>
          </div>
          <span className="font-mono text-[10px] text-[#87909a]" data-testid="text-register-count">3 controlled records</span>
        </div>
        <div className="divide-y divide-[#ece6d9]">
          {subPhases.map((item) => {
            const isExpanded = expanded === item.id;
            return (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0" data-testid={`row-subphase-${item.id.replace('.', '-')}`}>
                <button className="flex w-full items-start gap-3 text-left" onClick={() => setExpanded(isExpanded ? null : item.id)} aria-expanded={isExpanded} data-testid={`button-expand-subphase-${item.id.replace('.', '-')}`}>
                  <span className="mt-0.5 font-mono text-[11px] text-[#a27a32]">{item.id}</span>
                  <span className="flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#27384b]">{item.name}</span>
                      <StatusChip status={item.status} testId={`status-subphase-${item.id.replace('.', '-')}`} />
                    </span>
                    <span className="mt-1 block text-xs text-[#78828e]">{item.objective}</span>
                  </span>
                  <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-[#89929c] transition-transform', isExpanded && 'rotate-180')} />
                </button>
                {isExpanded && <div className="ml-8 mt-3 border-l-2 border-[#e4c978] py-1 pl-3 font-mono text-[10px] text-[#687481] animate-rise-in" data-testid={`text-evidence-${item.id.replace('.', '-')}`}>Evidence pointer · {item.evidence}</div>}
              </div>
            );
          })}
        </div>
      </section>
      <p className="mt-8 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-[#8f958f]" data-testid="text-footer-posture">KFIN Phase 0 · Pre-implementation foundation · Not production-ready</p>
    </div>
  );
}

function GovernancePage() {
  const records = [
    { id: 'KFIN-CON-001', type: 'Constitution', title: 'Development constitution', state: 'Accepted', date: '14 Feb 2025', icon: BookOpen, text: 'Authority, engineering principles, data protection and the Definition of Done.' },
    { id: 'KFIN-ADR-001', type: 'ADR', title: 'Architectural authority hierarchy', state: 'Accepted', date: '18 Feb 2025', icon: Landmark, text: 'Master specification → phase → sub-phase → ADR → requirement → code.' },
    { id: 'KFIN-CC-001', type: 'Change control', title: 'Controlled change process', state: 'Active', date: '21 Feb 2025', icon: GitBranch, text: 'Conflicts are identified, documented, assessed and resolved — never silently changed.' },
  ];
  return (
    <div className="mx-auto max-w-[1180px] animate-rise-in">
      <SectionHeading eyebrow="Control record / 0.1" title="Governance with a paper trail." detail="The architecture is authoritative by design. Every meaningful deviation needs a record, an impact assessment and an approved path forward." action={<span className="inline-flex items-center gap-2 rounded-lg border border-[#c8b98d] bg-[#faf4df] px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.11em] text-[#725b22]" data-testid="status-governance-posture"><ShieldCheck className="h-3.5 w-3.5" /> Controlled record</span>} />
      <div className="grid gap-6 lg:grid-cols-[.95fr_1.05fr]">
        <section className="rounded-xl bg-[#1c2b3f] p-6 text-[#e9e6dc] md:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#d5a33a]">Authority hierarchy</p>
          <h2 className="mt-4 font-[var(--app-font-serif)] text-2xl font-semibold leading-tight tracking-[-0.04em] text-[#f8f2e5]">Implementation does not outrank architecture.</h2>
          <p className="mt-4 text-sm leading-6 text-[#aeb8c2]">The console exposes the chain that keeps decisions accountable, from the master specification down to code.</p>
          <div className="mt-7 space-y-2">
            {['KFIN master specification', 'Phase specification', 'Sub-phase specification', 'Architecture decision record', 'Implementation requirement', 'Code'].map((label, index) => (
              <div key={label} className="flex items-center gap-3" data-testid={`row-authority-${index}`}>
                <span className="grid h-6 w-6 place-items-center rounded-full border border-[#56677c] font-mono text-[9px] text-[#d5a33a]">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-xs text-[#d6dce0]">{label}</span>
                {index < 5 && <span className="ml-auto text-[#65768a]">↓</span>}
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-[#ddd6c7] bg-[#fffdf8] p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#aa7925]">Operating rules</p><h2 className="mt-2 font-[var(--app-font-serif)] text-xl font-semibold tracking-[-0.03em]">What reviewers should expect</h2></div>
            <FileClock className="h-5 w-5 text-[#ab7a2a]" />
          </div>
          <div className="mt-6 space-y-4">
            {['No silent overrides of architectural decisions.', 'No implementation detail may invent an answer when blocked.', 'AI-assisted changes remain subject to the same review and evidence rules.', 'A change is accepted only when its documentation, tests and impact are visible.'].map((rule, index) => (
              <div className="flex gap-3" key={rule} data-testid={`text-governance-rule-${index}`}>
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#4d8c68]" />
                <p className="text-sm leading-5 text-[#5f6975]">{rule}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="mt-6 rounded-xl border border-[#ddd6c7] bg-[#fffdf8] p-5 md:p-7">
        <div className="mb-5 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#aa7925]">Record register</p><h2 className="mt-2 font-[var(--app-font-serif)] text-xl font-semibold tracking-[-0.03em]">Decisions that can be revisited properly.</h2></div><span className="font-mono text-[10px] text-[#87909a]" data-testid="text-governance-record-count">3 records</span></div>
        <div className="grid gap-3">
          {records.map((record) => { const Icon = record.icon; return (
            <details key={record.id} className="group rounded-lg border border-[#e8e1d4] bg-[#fcfaf4] open:bg-[#faf4df]" data-testid={`details-record-${record.id}`}>
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden" data-testid={`button-toggle-record-${record.id}`}>
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#e8e1d4] text-[#6f5d30]"><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-[#aa7925]">{record.id} · {record.type}</span><span className="mt-1 block text-sm font-semibold text-[#27384b]">{record.title}</span></span>
                <span className="hidden text-right sm:block"><span className="block text-xs font-semibold text-[#4d8c68]">{record.state}</span><span className="mt-1 block font-mono text-[9px] text-[#8b9299]">{record.date}</span></span>
                <ChevronDown className="h-4 w-4 text-[#7d8792] transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-[#e8dfcb] px-4 pb-4 pt-3 pl-[4.75rem] text-xs leading-5 text-[#6b7580]" data-testid={`text-record-description-${record.id}`}>{record.text}</div>
            </details>
          ); })}
        </div>
      </section>
    </div>
  );
}

function RepositoryPage() {
  const nodes = [
    ['apps', 'Application surfaces', 'Web console and future bounded services'],
    ['packages', 'Shared packages', 'Contracts and utilities where justified'],
    ['docs', 'Documentation', 'Specifications, ADRs and operational records'],
    ['tests', 'Verification', 'Unit, integration and acceptance evidence'],
    ['infrastructure', 'Infrastructure', 'Reproducible environments and deployment boundaries'],
  ];
  return (
    <div className="mx-auto max-w-[1180px] animate-rise-in">
      <SectionHeading eyebrow="Foundation map / 0.2" title="A repository with boundaries." detail="The repository is not a staging area for future operational modules. Its structure makes ownership, evidence and change surfaces legible." action={<Link href="/traceability" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#c8b98d] bg-[#fffdf8] px-4 py-2.5 text-xs font-semibold text-[#324359] transition-colors hover:bg-[#faf4df]" data-testid="link-repository-traceability">See requirement map <ArrowUpRight className="h-3.5 w-3.5" /></Link>} />
      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <section className="rounded-xl border border-[#ddd6c7] bg-[#fffdf8] p-6 md:p-8">
          <div className="flex items-center gap-3"><FolderTree className="h-5 w-5 text-[#aa7925]" /><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#aa7925]">Controlled tree</p></div>
          <div className="mt-7 rounded-lg border border-[#ddd6c7] bg-[#f8f5ed] p-4 font-mono text-xs">
            <p className="text-[#9b752e]">kfin/</p>
            <div className="ml-4 space-y-3 border-l border-[#d9cfbd] pl-4 pt-3">
              {nodes.map(([key, name], index) => <div className="flex items-start gap-2" key={key} data-testid={`row-repository-node-${key}`}><span className="text-[#b0a794]">├─</span><span><span className="text-[#334c62]">{key}/</span><span className="ml-2 text-[10px] text-[#84909a]"># {name}</span></span></div>)}
            </div>
          </div>
          <p className="mt-5 text-xs leading-5 text-[#737d87]" data-testid="text-repository-note">Boundaries are approved before operational domain surfaces are introduced.</p>
        </section>
        <section className="rounded-xl border border-[#ddd6c7] bg-[#fffdf8] p-6 md:p-8">
          <div className="mb-5 flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#aa7925]">Foundation inventory</p><h2 className="mt-2 font-[var(--app-font-serif)] text-xl font-semibold tracking-[-0.03em]">What exists before the domains.</h2></div><Code2 className="h-5 w-5 text-[#526f9b]" /></div>
          <div className="divide-y divide-[#ece6d9]">
            {nodes.map(([key, name, description], index) => <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0" key={key} data-testid={`item-foundation-${key}`}><span className="font-mono text-[10px] text-[#aa7925]">0{index + 1}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#27384b]">{name}</p><p className="mt-1 text-xs text-[#79828d]">{description}</p></div><CircleCheck className="h-4 w-4 shrink-0 text-[#4d8c68]" /></div>)}
          </div>
        </section>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <StatTile label="Package boundaries" value="05" detail="Named surfaces under control" accent="blue" testId="repository-boundaries" />
        <StatTile label="Production modules" value="00" detail="No operational domain claims" accent="green" testId="production-modules" />
        <StatTile label="Reproducibility" value="Ready" detail="Local foundation can be inspected" accent="gold" testId="reproducibility" />
      </div>
    </div>
  );
}

function QualityPage() {
  const [filter, setFilter] = useState('');
  const filtered = qualityGates.filter((gate) => `${gate.name} ${gate.purpose}`.toLowerCase().includes(filter.toLowerCase()));
  return (
    <div className="mx-auto max-w-[1180px] animate-rise-in">
      <SectionHeading eyebrow="Verification record / 0.3" title="Evidence is the gate." detail="A passing build is one signal, not a quality posture. Each control has a purpose, a command and an explicit status." action={<button className="inline-flex items-center gap-2 rounded-lg border border-[#c8b98d] bg-[#fffdf8] px-4 py-2.5 text-xs font-semibold text-[#324359] transition-colors hover:bg-[#faf4df]" onClick={() => setFilter('')} data-testid="button-reset-quality-filter"><RefreshCw className="h-3.5 w-3.5" /> Reset filters</button>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Passing" value="05" detail="Checks with verified evidence" accent="green" testId="quality-passing" />
        <StatTile label="Required" value="00" detail="Controls awaiting evidence" accent="blue" testId="quality-required" />
        <StatTile label="Ready" value="05" detail="Controls passing in CI suite" accent="gold" testId="quality-ready" />
      </div>
      <section className="mt-6 overflow-hidden rounded-xl border border-[#ddd6c7] bg-[#fffdf8]">
        <div className="flex flex-col gap-4 border-b border-[#e8e1d4] p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#aa7925]">Gate register</p><h2 className="mt-2 font-[var(--app-font-serif)] text-xl font-semibold tracking-[-0.03em]">Controls before progression.</h2></div>
          <label className="flex w-full items-center gap-2 rounded-lg border border-[#ddd6c7] bg-[#faf8f1] px-3 py-2 md:w-[245px]"><Search className="h-4 w-4 text-[#89929b]" /><input className="w-full bg-transparent text-xs text-[#324359] outline-none placeholder:text-[#9ba1a5]" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter controls" aria-label="Filter quality controls" data-testid="input-filter-quality" /></label>
        </div>
        <div className="divide-y divide-[#ece6d9]">
          {filtered.map((gate, index) => <div className="grid gap-4 p-5 transition-colors hover:bg-[#fcfaf4] md:grid-cols-[1.3fr_.8fr_.9fr] md:items-center md:p-6" key={gate.name} data-testid={`row-quality-gate-${index}`}><div className="flex items-start gap-3"><span className={cn('mt-0.5 grid h-7 w-7 place-items-center rounded-md bg-[#e7f2ea] text-[#387452]')}><ClipboardCheck className="h-3.5 w-3.5" /></span><div><p className="text-sm font-semibold text-[#27384b]" data-testid={`text-quality-name-${index}`}>{gate.name}</p><p className="mt-1 text-xs leading-5 text-[#79828d]" data-testid={`text-quality-purpose-${index}`}>{gate.purpose}</p></div></div><div className="md:pl-2"><StatusChip status={gate.status} testId={`status-quality-gate-${index}`} /><p className="mt-2 font-mono text-[10px] text-[#7f8993]" data-testid={`text-quality-command-${index}`}>{gate.command}</p></div><div className="flex items-center gap-2 md:justify-end"><span className="font-mono text-[10px] text-[#9299a0]">Control {String(index + 1).padStart(2, '0')}</span><ArrowUpRight className="h-3.5 w-3.5 text-[#aa7925]" /></div></div>)}
          {filtered.length === 0 && <div className="p-12 text-center" data-testid="empty-quality-results"><CircleAlert className="mx-auto h-6 w-6 text-[#aa7925]" /><p className="mt-3 text-sm font-semibold text-[#324359]">No controls match that filter.</p><p className="mt-1 text-xs text-[#7f8993]">Reset the register to restore every quality gate.</p></div>}
        </div>
      </section>
      <div className="mt-6 rounded-xl border border-[#a8d5ba] bg-[#eef8f1] p-5 md:p-6"><div className="flex gap-3"><CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#2e7d52]" /><div><p className="text-sm font-semibold text-[#1e5236]" data-testid="status-quality-warning">Acceptance gate satisfied</p><p className="mt-1 text-xs leading-5 text-[#2d6847]">All Phase 0 quality gates are evidenced and passing. Full type safety, test verification, production build, secret scanning, and dependency audits are verified.</p></div></div></div>
    </div>
  );
}

function TraceabilityPage() {
  return (
    <div className="mx-auto max-w-[1180px] animate-rise-in">
      <SectionHeading eyebrow="Scope register / acceptance" title="Trace what is promised." detail="The traceability view protects the boundary between a credible foundation and a premature operational claim." action={<span className="inline-flex items-center gap-2 rounded-lg border border-[#c8b98d] bg-[#fffdf8] px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.11em] text-[#725b22]" data-testid="status-traceability-posture"><Waypoints className="h-3.5 w-3.5" /> Scope is explicit</span>} />
      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-xl border border-[#ddd6c7] bg-[#fffdf8] p-6 md:p-8">
          <div className="flex items-center gap-3"><Waypoints className="h-5 w-5 text-[#aa7925]" /><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#aa7925]">Requirement map</p></div>
          <div className="mt-6 space-y-3">
            {[
              ['GOV-01', 'Engineering constitution', 'Governance', 'Established'],
              ['REP-01', 'Controlled repository structure', 'Repository', 'Established'],
              ['QAL-01', 'Automated quality gates', 'Quality', 'Established'],
              ['INT-01', 'Production institutional exchange', 'Deferred', 'Deferred'],
              ['DOM-01', 'Operational forensic domains', 'Deferred', 'Deferred'],
            ].map(([id, title, group, state]) => <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e8e1d4] p-3.5" key={id} data-testid={`row-requirement-${id}`}><span className="font-mono text-[10px] text-[#aa7925]">{id}</span><span className="min-w-[160px] flex-1 text-sm font-medium text-[#324359]">{title}</span><span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#8b9299]">{group}</span><span className={cn('rounded-full px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em]', state === 'Established' ? 'bg-[#e8f2ea] text-[#387452]' : state === 'Gated' ? 'bg-[#f8efda] text-[#816522]' : 'border border-[#d6cebf] bg-[#ede8dc] text-[#554e42]')} data-testid={`status-requirement-${id}`}>{state}</span></div>)}
          </div>
        </section>
        <section className="rounded-xl border border-[#ddd6c7] bg-[#fffdf8] p-6 md:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#aa7925]">Reading the register</p>
          <h2 className="mt-3 font-[var(--app-font-serif)] text-2xl font-semibold leading-tight tracking-[-0.04em] text-[#1c2b3f]">Deferred is a decision.</h2>
          <p className="mt-3 text-sm leading-6 text-[#6c7682]">A deferred scope item is not missing work. It is a deliberate boundary with a named condition for reconsideration.</p>
          <div className="mt-7 space-y-3 border-t border-[#e8e1d4] pt-5">
            <div className="flex items-center justify-between text-xs"><span className="text-[#7c8590]">Foundation requirements</span><span className="font-mono text-[#334c62]" data-testid="value-foundation-requirements">03 tracked</span></div>
            <div className="flex items-center justify-between text-xs"><span className="text-[#7c8590]">Deferred boundaries</span><span className="font-mono text-[#554e42]" data-testid="value-deferred-boundaries">02 tracked</span></div>
            <div className="flex items-center justify-between text-xs"><span className="text-[#7c8590]">Operational modules</span><span className="font-mono text-[#334c62]" data-testid="value-operational-modules">00 claimed</span></div>
          </div>
        </section>
      </div>
      <section className="mt-6 rounded-xl border border-[#ddd6c7] bg-[#fffdf8] p-5 md:p-7">
        <div className="mb-6"><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#aa7925]">Deferred scope</p><h2 className="mt-2 font-[var(--app-font-serif)] text-xl font-semibold tracking-[-0.03em]">Not yet. Not accidentally.</h2></div>
        <div className="grid gap-3 md:grid-cols-2">
          {deferredItems.map((item, index) => <div className="rounded-lg border border-[#e8e1d4] bg-[#fcfaf4] p-4 transition-colors hover:border-[#d5c38e]" key={item.domain} data-testid={`card-deferred-${index}`}><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold text-[#324359]" data-testid={`text-deferred-domain-${index}`}>{item.domain}</h3><span className="rounded-full border border-[#d6cebf] bg-[#ede8dc] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#554e42]" data-testid={`status-deferred-${index}`}>Deferred</span></div><p className="mt-3 text-xs leading-5 text-[#737d87]" data-testid={`text-deferred-reason-${index}`}>{item.reason}</p><div className="mt-4 flex items-center gap-2 border-t border-[#e8e1d4] pt-3"><Timer className="h-3.5 w-3.5 text-[#aa7925]" /><span className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#8b9299]">Unlock</span><span className="text-xs font-medium text-[#5f6975]" data-testid={`text-deferred-unlock-${index}`}>{item.unlock}</span></div></div>)}
        </div>
      </section>
    </div>
  );
}

function Router() {
  return (
    <ErrorBoundary>
      <Shell>
        <Switch>
          <Route path="/" component={OverviewPage} />
          <Route path="/governance" component={GovernancePage} />
          <Route path="/repository" component={RepositoryPage} />
          <Route path="/quality" component={QualityPage} />
          <Route path="/traceability" component={TraceabilityPage} />
          <Route component={NotFound} />
        </Switch>
      </Shell>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;