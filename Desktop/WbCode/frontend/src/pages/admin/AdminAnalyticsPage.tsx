import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import SkeletonLoader from '../../components/SkeletonLoader';
import StatCard from '../../components/StatCard';
import MetricChart from '../../components/MetricChart';
import {
  Activity,
  Target,
  TrendingUp,
  Users,
  Link as LinkIcon,
  Percent,
  CalendarRange,
  Copy,
  Sparkles,
  Zap,
  HeartPulse,
  Coins,
  LifeBuoy,
  X
} from 'lucide-react';

type AnalyticsMetrics = {
  from: string;
  to: string;
  dau: number;
  missionDau: number;
  codelabStarts: number;
  codelabCompleted: number;
  codelabCompletionRate: number; // 0..1
  invitesSent: number;
  invitesAccepted: number;
  newUsers: number;
  viralCoefficient: number;
  inviteConversion: number; // 0..1
};

type CreatedInvite = {
  id: number;
  code: string;
  inviterId: number;
  inviteeEmail?: string | null;
  createdAt: string;
  acceptedAt?: string | null;
  acceptedUserId?: number | null;
};

type GamificationAnalytics = {
  streakResilience: {
    from: string;
    to: string;
    streakLostUsers: number;
    returnedWithin3Days: number;
    resilienceRate: number;
  };
  dopamineEffect: {
    from: string;
    to: string;
    badgeUnlocks: number;
    unlockUsers: number;
    usersWithSpike: number;
    spikeRate: number;
  };
  economyStats: {
    from: string;
    to: string;
    averageCoinsEarnedPerDayPerDau: number;
    averageCoinsSpentPerDayPerDau: number;
    hoardingIndex: number;
    highBalanceUsers: number;
    hoardingUsers: number;
  };
  hintEfficiency: {
    from: string;
    to: string;
    purchases: number;
    conversions: number;
    conversionRate: number;
  };
};

type GamificationMetricKey = 'streak' | 'dopamine' | 'economy' | 'hint';

function toDateInputValue(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function clampDateRange(from: Date, to: Date) {
  if (from.getTime() > to.getTime()) return { from: to, to: from };
  return { from, to };
}

const AdminAnalyticsPage = () => {
  const now = useMemo(() => new Date(), []);
  const defaultTo = useMemo(() => toDateInputValue(now), [now]);
  const defaultFrom = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 6); // last 7 days incl today
    return toDateInputValue(d);
  }, [now]);

  const [fromDay, setFromDay] = useState(defaultFrom);
  const [toDay, setToDay] = useState(defaultTo);
  const [inviteEmail, setInviteEmail] = useState('');
  const [createdInvite, setCreatedInvite] = useState<CreatedInvite | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [activeMetric, setActiveMetric] = useState<GamificationMetricKey | null>(null);
  const [metricFromDay, setMetricFromDay] = useState(defaultFrom);
  const [metricToDay, setMetricToDay] = useState(defaultTo);

  const { fromISO, toISO } = useMemo(() => {
    const fromD = new Date(`${fromDay}T00:00:00`);
    const toD = new Date(`${toDay}T23:59:59`);
    const normalized = clampDateRange(fromD, toD);
    return { fromISO: normalized.from.toISOString(), toISO: normalized.to.toISOString() };
  }, [fromDay, toDay]);

  const { fromISO: metricFromISO, toISO: metricToISO } = useMemo(() => {
    const fromD = new Date(`${metricFromDay}T00:00:00`);
    const toD = new Date(`${metricToDay}T23:59:59`);
    const normalized = clampDateRange(fromD, toD);
    return { fromISO: normalized.from.toISOString(), toISO: normalized.to.toISOString() };
  }, [metricFromDay, metricToDay]);

  const { data, isLoading, error } = useQuery<AnalyticsMetrics>({
    queryKey: ['admin-analytics', fromISO, toISO],
    queryFn: async () => {
      const res = await api.get('/analytics/metrics', { params: { from: fromISO, to: toISO } });
      return res.data;
    }
  });

  const {
    data: gamification,
    isLoading: isLoadingGamification,
    error: gamificationError
  } = useQuery<GamificationAnalytics>({
    queryKey: ['admin-analytics-gamification', fromISO, toISO],
    queryFn: async () => {
      const res = await api.get('/analytics/gamification', { params: { from: fromISO, to: toISO } });
      return res.data;
    }
  });

  const {
    data: modalGamification,
    isLoading: isLoadingModalGamification,
    error: modalGamificationError
  } = useQuery<GamificationAnalytics>({
    queryKey: ['admin-analytics-gamification-modal', metricFromISO, metricToISO, activeMetric],
    queryFn: async () => {
      const res = await api.get('/analytics/gamification', { params: { from: metricFromISO, to: metricToISO } });
      return res.data;
    },
    enabled: Boolean(activeMetric)
  });

  const completionPct = Math.round(((data?.codelabCompletionRate ?? 0) * 100 + Number.EPSILON) * 10) / 10;
  const inviteConvPct = Math.round(((data?.inviteConversion ?? 0) * 100 + Number.EPSILON) * 10) / 10;
  const viral = Math.round(((data?.viralCoefficient ?? 0) + Number.EPSILON) * 100) / 100;

  const streakResiliencePct = Math.round(((gamification?.streakResilience.resilienceRate ?? 0) * 100 + Number.EPSILON) * 10) / 10;
  const dopaminePct = Math.round(((gamification?.dopamineEffect.spikeRate ?? 0) * 100 + Number.EPSILON) * 10) / 10;
  const hintEfficiencyPct = Math.round(((gamification?.hintEfficiency.conversionRate ?? 0) * 100 + Number.EPSILON) * 10) / 10;
  const earnedPerDau = Math.round(((gamification?.economyStats.averageCoinsEarnedPerDayPerDau ?? 0) + Number.EPSILON) * 10) / 10;
  const spentPerDau = Math.round(((gamification?.economyStats.averageCoinsSpentPerDayPerDau ?? 0) + Number.EPSILON) * 10) / 10;
  const hoardingPct = Math.round(((gamification?.economyStats.hoardingIndex ?? 0) * 100 + Number.EPSILON) * 10) / 10;

  const modalStreakPct = Math.round(((modalGamification?.streakResilience.resilienceRate ?? 0) * 100 + Number.EPSILON) * 10) / 10;
  const modalDopaminePct = Math.round(((modalGamification?.dopamineEffect.spikeRate ?? 0) * 100 + Number.EPSILON) * 10) / 10;
  const modalHintPct = Math.round(((modalGamification?.hintEfficiency.conversionRate ?? 0) * 100 + Number.EPSILON) * 10) / 10;
  const modalEarnedPerDau = Math.round(((modalGamification?.economyStats.averageCoinsEarnedPerDayPerDau ?? 0) + Number.EPSILON) * 10) / 10;
  const modalSpentPerDau = Math.round(((modalGamification?.economyStats.averageCoinsSpentPerDayPerDau ?? 0) + Number.EPSILON) * 10) / 10;
  const modalHoardingPct = Math.round(((modalGamification?.economyStats.hoardingIndex ?? 0) * 100 + Number.EPSILON) * 10) / 10;

  const buildSeries = (value: number) => {
    const labels: string[] = [];
    const values: number[] = [];
    const start = new Date(`${metricFromDay}T00:00:00`);
    const end = new Date(`${metricToDay}T00:00:00`);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      labels.push(d.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' }));
      values.push(value);
    }
    return { labels, values };
  };

  const openMetricModal = (metric: GamificationMetricKey) => {
    setMetricFromDay(fromDay);
    setMetricToDay(toDay);
    setActiveMetric(metric);
  };

  const setQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    setMetricFromDay(toDateInputValue(start));
    setMetricToDay(toDateInputValue(end));
  };

  const activeMetricLabel = {
    streak: 'Streak Resilience',
    dopamine: 'Dopamine Spike',
    economy: 'Economy Velocity',
    hint: 'Hint Efficiency'
  }[activeMetric ?? 'streak'];

  const modalSeries = useMemo(() => {
    if (!activeMetric || !modalGamification) {
      return { labels: [], series: [] as { label: string; values: number[]; color: string; fillColor?: string }[] };
    }

    if (activeMetric === 'economy') {
      const earned = buildSeries(modalEarnedPerDau);
      const spent = buildSeries(modalSpentPerDau);
      return {
        labels: earned.labels,
        series: [
          { label: 'Earned / DAU / day', values: earned.values, color: '#22c55e', fillColor: 'rgba(34,197,94,0.15)' },
          { label: 'Spent / DAU / day', values: spent.values, color: '#f97316', fillColor: 'rgba(249,115,22,0.1)' }
        ]
      };
    }

    if (activeMetric === 'dopamine') {
      const spike = buildSeries(modalDopaminePct);
      return {
        labels: spike.labels,
        series: [{ label: 'Spike rate (%)', values: spike.values, color: '#38bdf8', fillColor: 'rgba(56,189,248,0.12)' }]
      };
    }

    if (activeMetric === 'hint') {
      const eff = buildSeries(modalHintPct);
      return {
        labels: eff.labels,
        series: [{ label: 'Efficiency (%)', values: eff.values, color: '#a855f7', fillColor: 'rgba(168,85,247,0.12)' }]
      };
    }

    const streak = buildSeries(modalStreakPct);
    return {
      labels: streak.labels,
      series: [{ label: 'Resilience (%)', values: streak.values, color: '#22c55e', fillColor: 'rgba(34,197,94,0.12)' }]
    };
  }, [
    activeMetric,
    modalGamification,
    metricFromDay,
    metricToDay,
    modalDopaminePct,
    modalHintPct,
    modalStreakPct,
    modalEarnedPerDau,
    modalSpentPerDau
  ]);

  const inviteLink = useMemo(() => {
    if (!createdInvite?.code) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/auth/register?ref=${encodeURIComponent(createdInvite.code)}`;
  }, [createdInvite?.code]);

  const generateInvite = async () => {
    setCopyStatus(null);
    const payload: any = {};
    if (inviteEmail.trim()) payload.inviteeEmail = inviteEmail.trim();
    const res = await api.post('/analytics/invites', payload);
    setCreatedInvite(res.data);
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyStatus('Link copiat!');
      setTimeout(() => setCopyStatus(null), 1500);
    } catch {
      setCopyStatus('Nu pot copia automat. Selectează și copiază manual.');
      setTimeout(() => setCopyStatus(null), 2500);
    }
  };

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-cyan-500/10 p-6 md:p-8">
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">Admin</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Analytics</h1>
            <p className="text-slate-300 mt-2 max-w-2xl">
              DAU, engagement pe Missions, funnel CodeLab și viral coefficient. Datele se strâng prin evenimente lightweight.
            </p>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CalendarRange className="h-4 w-4 text-blue-300" />
              <span>Interval</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDay}
                onChange={(e) => setFromDay(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
              <span className="text-slate-400">→</span>
              <input
                type="date"
                value={toDay}
                onChange={(e) => setToDay(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
        </div>
      </header>

      {isLoading || isLoadingGamification ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          <SkeletonLoader type="card" count={8} />
        </div>
      ) : error || gamificationError ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">
          Nu pot încărca analytics. Asigură-te că ești logat ca ADMIN și backend-ul rulează.
        </div>
      ) : (
        <>
          {/* Referral tools */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-300" />
                  Referral invites
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Generează un link de invitație. La înregistrare, codul se atașează automat (query param <code>ref</code>).
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email (opțional)"
                className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={() => generateInvite()}
                className="btn-press rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                Generează link
              </button>
            </div>

            {createdInvite && (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Referral code</p>
                    <p className="text-sm font-mono text-white break-all">{createdInvite.code}</p>
                  </div>
                  <button
                    onClick={() => copyInviteLink()}
                    className="btn-press inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900 transition-colors"
                    title="Copiază link"
                  >
                    <Copy className="h-4 w-4" />
                    Copiază
                  </button>
                </div>

                <div className="mt-3">
                  <p className="text-xs text-slate-400">Invite link</p>
                  <p className="text-xs font-mono text-slate-200 break-all">{inviteLink}</p>
                  {copyStatus && <p className="mt-2 text-xs text-emerald-300">{copyStatus}</p>}
                </div>
              </div>
            )}
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Activity}
              title="DAU"
              value={data?.dau ?? 0}
              subtitle="Utilizatori activi în interval"
              color="primary"
            />
            <StatCard
              icon={Target}
              title="Mission DAU"
              value={data?.missionDau ?? 0}
              subtitle="Au deschis/claim-uit Missions"
              color="secondary"
            />
            <StatCard
              icon={Percent}
              title="Completion Rate"
              value={`${completionPct}%`}
              subtitle={`${data?.codelabCompleted ?? 0}/${data?.codelabStarts ?? 0} start → solved`}
              color="success"
            />
            <StatCard
              icon={TrendingUp}
              title="Viral Coefficient"
              value={viral}
              subtitle="Invites accepted / New users"
              color="warning"
            />
          </div>

          {/* Advanced gamification analytics */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
            <button type="button" onClick={() => openMetricModal('streak')} className="text-left">
              <StatCard
                icon={HeartPulse}
                title="Streak Resilience"
                value={`${streakResiliencePct}%`}
                subtitle={`${gamification?.streakResilience.returnedWithin3Days ?? 0}/${gamification?.streakResilience.streakLostUsers ?? 0} reveniți în 3 zile`}
                color="success"
              />
            </button>
            <button type="button" onClick={() => openMetricModal('dopamine')} className="text-left">
              <StatCard
                icon={Zap}
                title="Dopamine Spike"
                value={`${dopaminePct}%`}
                subtitle={`${gamification?.dopamineEffect.usersWithSpike ?? 0}/${gamification?.dopamineEffect.unlockUsers ?? 0} activi în 15 min`}
                color="info"
              />
            </button>
            <button type="button" onClick={() => openMetricModal('economy')} className="text-left">
              <StatCard
                icon={Coins}
                title="Economy Velocity"
                value={`${earnedPerDau} / ${spentPerDau}`}
                subtitle={`Earn/Spend per DAU/day · Hoarding ${hoardingPct}%`}
                color="warning"
              />
            </button>
            <button type="button" onClick={() => openMetricModal('hint')} className="text-left">
              <StatCard
                icon={LifeBuoy}
                title="Hint Efficiency"
                value={`${hintEfficiencyPct}%`}
                subtitle={`${gamification?.hintEfficiency.conversions ?? 0}/${gamification?.hintEfficiency.purchases ?? 0} solved in 1h`}
                color="secondary"
              />
            </button>
          </div>

          {/* Supporting metrics */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <StatCard
              icon={LinkIcon}
              title="Invites Sent"
              value={data?.invitesSent ?? 0}
              subtitle="Referral codes create"
              color="info"
            />
            <StatCard
              icon={LinkIcon}
              title="Invites Accepted"
              value={data?.invitesAccepted ?? 0}
              subtitle={`Conversion: ${inviteConvPct}%`}
              color="success"
            />
            <StatCard
              icon={Users}
              title="New Users"
              value={data?.newUsers ?? 0}
              subtitle="În interval"
              color="secondary"
            />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 text-sm text-slate-300">
            <p className="font-semibold text-white mb-2">Notă despre metrici</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>
                <span className="font-semibold">DAU</span>: preferă evenimentul <code>APP_OPEN</code>; dacă nu există încă date, face fallback la
                submissions.
              </li>
              <li>
                <span className="font-semibold">Completion Rate</span>: calculat din <code>CODELAB_START</code> și “solve” (submission CODING cu score&gt;0)
                în interval.
              </li>
              <li>
                <span className="font-semibold">Viral Coefficient</span>: versiune simplă (accepted invites / new users). Devine foarte precis când
                adăugăm UI de invite + auto-fill referral la register.
              </li>
            </ul>
          </div>
        </>
      )}

      {activeMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">Gamification Analytics</p>
                <h3 className="text-xl font-semibold text-white">{activeMetricLabel}</h3>
                <p className="text-sm text-slate-400 mt-1">Selectează timeframe-ul pentru a vedea trendul.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveMetric(null)}
                className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setQuickRange(7)}
                className="rounded-full border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800"
              >
                7 zile
              </button>
              <button
                type="button"
                onClick={() => setQuickRange(30)}
                className="rounded-full border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800"
              >
                30 zile
              </button>
              <button
                type="button"
                onClick={() => setQuickRange(90)}
                className="rounded-full border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800"
              >
                90 zile
              </button>
              <div className="ml-auto flex items-center gap-2">
                <input
                  type="date"
                  value={metricFromDay}
                  onChange={(e) => setMetricFromDay(e.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                />
                <span className="text-slate-500">→</span>
                <input
                  type="date"
                  value={metricToDay}
                  onChange={(e) => setMetricToDay(e.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            <div className="mt-4">
              {isLoadingModalGamification ? (
                <SkeletonLoader type="card" count={1} />
              ) : modalGamificationError ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                  Nu pot încărca datele pentru acest timeframe.
                </div>
              ) : (
                <MetricChart labels={modalSeries.labels} series={modalSeries.series} />
              )}
            </div>

            {activeMetric === 'economy' && (
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                <span>Earned/DAU/day: {modalEarnedPerDau}</span>
                <span>Spent/DAU/day: {modalSpentPerDau}</span>
                <span>Hoarding: {modalHoardingPct}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsPage;



