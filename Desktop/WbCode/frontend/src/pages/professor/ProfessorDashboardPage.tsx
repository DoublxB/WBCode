import { useMemo, useState } from 'react';
import {
  useMyClasses,
  useProfessorClassLeaderboard,
  useProfessorClassModules,
  useProfessorClassRisks,
  useProfessorClassStudents,
  useProfessorClassSummary,
  useProfessorClassTimeseries
} from '../../api/hooks';
import StatCard from '../../components/StatCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { Activity, BarChart3, CalendarRange, Download, Flame, Target, Trophy, TrendingUp, Users, Zap } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

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

const ProfessorDashboardPage = () => {
  const now = useMemo(() => new Date(), []);
  const defaultTo = useMemo(() => toDateInputValue(now), [now]);
  const defaultFrom = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return toDateInputValue(d);
  }, [now]);

  const [fromDay, setFromDay] = useState(defaultFrom);
  const [toDay, setToDay] = useState(defaultTo);
  const [leaderMetric, setLeaderMetric] = useState<'xpGain' | 'xpTotal' | 'solved'>('xpGain');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const { fromISO, toISO } = useMemo(() => {
    const fromD = new Date(`${fromDay}T00:00:00`);
    const toD = new Date(`${toDay}T23:59:59`);
    const normalized = clampDateRange(fromD, toD);
    return { fromISO: normalized.from.toISOString(), toISO: normalized.to.toISOString() };
  }, [fromDay, toDay]);

  const { data: classes = [], isLoading: classesLoading } = useMyClasses();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  // Auto-select first class
  useMemo(() => {
    if (!selectedClassId && classes && classes.length > 0) {
      setSelectedClassId(Number(classes[0].id));
    }
    return null;
  }, [classes, selectedClassId]);

  const summary = useProfessorClassSummary(selectedClassId, fromISO, toISO);
  const leaderboard = useProfessorClassLeaderboard(selectedClassId, leaderMetric, fromISO, toISO);
  const students = useProfessorClassStudents(selectedClassId, fromISO, toISO);
  const risks = useProfessorClassRisks(selectedClassId, fromISO, toISO);
  const modules = useProfessorClassModules(selectedClassId, fromISO, toISO);
  const tsSubmissions = useProfessorClassTimeseries(selectedClassId, 'submissions', fromISO, toISO);
  const tsActive = useProfessorClassTimeseries(selectedClassId, 'activeStudents', fromISO, toISO);

  const chartData = useMemo(() => {
    const pointsA = (tsSubmissions.data?.points || []) as Array<{ day: string; value: number }>;
    const pointsB = (tsActive.data?.points || []) as Array<{ day: string; value: number }>;
    const labels = pointsA.map((p) => p.day);
    return {
      labels,
      datasets: [
        {
          label: 'Submisii',
          data: pointsA.map((p) => p.value),
          borderColor: 'rgba(34, 211, 238, 0.9)', // cyan
          backgroundColor: 'rgba(34, 211, 238, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 0
        },
        {
          label: 'Elevi activi',
          data: pointsB.map((p) => p.value),
          borderColor: 'rgba(52, 211, 153, 0.9)', // emerald
          backgroundColor: 'rgba(52, 211, 153, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 0
        }
      ]
    };
  }, [tsSubmissions.data?.points, tsActive.data?.points]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: '#cbd5e1' } },
        tooltip: { enabled: true }
      },
      scales: {
        x: { ticks: { color: '#94a3b8', maxTicksLimit: 8 }, grid: { color: 'rgba(148,163,184,0.08)' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' } }
      }
    }),
    []
  );

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-cyan-500/10 p-6 md:p-8">
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">PROFESSOR</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-300 mt-2 max-w-2xl">
              Monitorizare “whole-class”: engagement, progres, performanță și risc de abandon. Datele sunt limitate la elevii din clasele tale.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="info">
                <Users className="h-4 w-4" />
                {classesLoading ? '...' : `${classes.length} clase`}
              </Badge>
              <Badge variant="default">
                <BarChart3 className="h-4 w-4" />
                KPI + grafice
              </Badge>
            </div>
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

      {/* Class selector */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="text-sm text-slate-300 flex items-center gap-2">
          <Target className="h-4 w-4 text-cyan-300" />
          Clasă
        </div>
        <select
          value={selectedClassId ?? ''}
          onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : null)}
          className="flex-1 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
        >
          {classes.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setLeaderMetric('xpGain')} className={cn(leaderMetric === 'xpGain' && 'border-cyan-500/40')}>
            <Zap className="h-4 w-4" />
            XP gain
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setLeaderMetric('xpTotal')} className={cn(leaderMetric === 'xpTotal' && 'border-cyan-500/40')}>
            <TrendingUp className="h-4 w-4" />
            XP total
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setLeaderMetric('solved')} className={cn(leaderMetric === 'solved' && 'border-cyan-500/40')}>
            <Trophy className="h-4 w-4" />
            Solved
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (!selectedClassId) return;
              const url = `/api/professor/analytics/classes/${selectedClassId}/export?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`;
              window.open(url, '_blank');
            }}
            className="border-emerald-500/20 hover:border-emerald-500/40"
            title="Export CSV (clasa selectată)"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {summary.isLoading || classesLoading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          <SkeletonLoader type="card" count={8} />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Users} title="Elevi" value={summary.data?.studentCount ?? 0} subtitle="În clasa selectată" color="primary" />
          <StatCard icon={Activity} title="Activi" value={summary.data?.activeStudents ?? 0} subtitle="Unici în interval" color="success" />
          <StatCard icon={BarChart3} title="Submisii" value={summary.data?.submissions ?? 0} subtitle="Quiz + Coding" color="secondary" />
          <StatCard icon={Flame} title="XP gain" value={summary.data?.xpGain ?? 0} subtitle="Sumă XPEvent" color="warning" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* At-risk */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 xl:col-span-1">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-rose-300" />
            At-risk (early warning)
          </h2>
          <p className="text-sm text-slate-400 mt-1">Semnale interpretabile: inactivitate, engagement 0, performanță scăzută.</p>

          {risks.isLoading ? (
            <div className="mt-4">
              <SkeletonLoader type="list" count={6} />
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5">
                  HIGH: {(risks.data?.counts?.HIGH ?? 0) as any}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5">
                  MEDIUM: {(risks.data?.counts?.MEDIUM ?? 0) as any}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950/20 px-2 py-0.5">
                  LOW: {(risks.data?.counts?.LOW ?? 0) as any}
                </span>
              </div>

              {(risks.data?.atRisk || []).length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-4 text-sm text-slate-300">
                  Niciun elev nu are semnale de risc în interval.
                </div>
              ) : (
                (risks.data?.atRisk || []).slice(0, 8).map((r: any) => (
                  <button
                    key={r.user.id}
                    onClick={() => setSelectedStudentId(Number(r.user.id))}
                    className="w-full text-left rounded-xl border border-slate-800 bg-slate-950/20 hover:bg-white/5 px-4 py-3 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-white">
                        {r.user.firstName} {r.user.lastName}
                      </div>
                      <div className="text-xs text-slate-400">score: {r.score}</div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(r.flags || []).slice(0, 3).map((f: any, idx: number) => (
                        <span
                          key={idx}
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border',
                            f.severity === 'HIGH'
                              ? 'text-rose-200 border-rose-500/30 bg-rose-500/10'
                              : f.severity === 'MEDIUM'
                              ? 'text-amber-200 border-amber-500/30 bg-amber-500/10'
                              : 'text-slate-300 border-slate-700 bg-slate-950/20'
                          )}
                        >
                          {f.label}
                        </span>
                      ))}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 xl:col-span-1">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-300" />
            Leaderboard (local)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {leaderMetric === 'xpGain' ? 'Clasament pe XP câștigat în interval' : leaderMetric === 'xpTotal' ? 'Clasament pe XP total' : 'Clasament pe probleme rezolvate în interval'}
          </p>

          {leaderboard.isLoading ? (
            <div className="mt-4">
              <SkeletonLoader type="list" count={6} />
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-300 bg-slate-950/30">
                  <tr>
                    <th className="px-3 py-2 font-semibold">#</th>
                    <th className="px-3 py-2 font-semibold">Elev</th>
                    <th className="px-3 py-2 font-semibold text-right">{leaderMetric === 'solved' ? 'Solved' : 'XP'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(leaderboard.data?.rows || []).map((r: any) => (
                    <tr
                      key={r.user.id}
                      className="border-t border-slate-800 hover:bg-white/5 cursor-pointer"
                      onClick={() => setSelectedStudentId(Number(r.user.id))}
                    >
                      <td className="px-3 py-2 font-bold text-slate-200">#{r.rank}</td>
                      <td className="px-3 py-2 text-slate-200">
                        {r.user.firstName} {r.user.lastName}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-cyan-300">{Number(r.value || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 xl:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-cyan-300" />
                Trend (interval)
              </h2>
              <p className="text-sm text-slate-400 mt-1">Submisii și elevi activi (bucket pe zi).</p>
            </div>
          </div>

          <div className="mt-4 h-[260px]">
            <Line data={chartData as any} options={chartOptions as any} />
          </div>

          {/* Module distribution (lightweight) */}
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-white">Distribuție pe module (Solved în interval)</div>
              <div className="text-xs text-slate-400">total: {Number(modules.data?.totalSolved ?? 0)}</div>
            </div>
            {modules.isLoading ? (
              <div className="mt-3">
                <SkeletonLoader type="list" count={3} />
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {(modules.data?.modules || []).map((m: any) => {
                  const pct = (modules.data?.totalSolved ?? 0) > 0 ? Math.round((m.solved / modules.data.totalSolved) * 100) : 0;
                  return (
                    <div key={m.slug} className="flex items-center gap-3">
                      <div className="w-44 text-xs text-slate-300">{m.slug}</div>
                      <div className="flex-1 h-2 rounded-full bg-slate-900/60 overflow-hidden border border-slate-800">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400" style={{ width: `${Math.max(2, pct)}%` }} />
                      </div>
                      <div className="w-16 text-right text-xs text-slate-300">{m.solved}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Students table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-300" />
          Elevi (detaliat)
        </h2>
        <p className="text-sm text-slate-400 mt-1">Click pe un elev pentru detalii rapide (XP, streak, coins, activitate).</p>

        {students.isLoading ? (
          <div className="mt-4">
            <SkeletonLoader type="list" count={8} />
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-300 bg-slate-950/30">
                <tr>
                  <th className="px-3 py-2 font-semibold">Elev</th>
                  <th className="px-3 py-2 font-semibold">Act.</th>
                  <th className="px-3 py-2 font-semibold text-right">XP total</th>
                  <th className="px-3 py-2 font-semibold text-right">XP gain</th>
                  <th className="px-3 py-2 font-semibold text-right">Solved</th>
                  <th className="px-3 py-2 font-semibold text-right">Submisii</th>
                  <th className="px-3 py-2 font-semibold text-right">Streak</th>
                  <th className="px-3 py-2 font-semibold text-right">Coins</th>
                </tr>
              </thead>
              <tbody>
                {(students.data?.students || []).map((s: any) => (
                  <tr
                    key={s.id}
                    className="border-t border-slate-800 hover:bg-white/5 cursor-pointer"
                    onClick={() => setSelectedStudentId(Number(s.id))}
                  >
                    <td className="px-3 py-2 text-slate-200 font-medium">{s.firstName} {s.lastName}</td>
                    <td className="px-3 py-2">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border', s.activeInRange ? 'text-emerald-200 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-300 border-slate-700 bg-slate-950/20')}>
                        {s.activeInRange ? 'DA' : 'NU'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-200">{Number(s.xpTotal || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-cyan-300 font-semibold">{Number(s.xpGain || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-slate-200">{Number(s.solvedProblems || 0)}</td>
                    <td className="px-3 py-2 text-right text-slate-200">{Number(s.submissions || 0)}</td>
                    <td className="px-3 py-2 text-right text-amber-200">{Number(s.streak || 0)}</td>
                    <td className="px-3 py-2 text-right text-emerald-200">{Number(s.coins || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student quick modal */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedStudentId(null)}>
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950/70 backdrop-blur-xl p-6" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const s = (students.data?.students || []).find((x: any) => Number(x.id) === Number(selectedStudentId));
              if (!s) return <div className="text-slate-200">Nu găsesc elevul.</div>;
              return (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-white">{s.firstName} {s.lastName}</h3>
                      <p className="text-sm text-slate-400">{s.email}</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setSelectedStudentId(null)}>
                      Închide
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                      <div className="text-xs text-slate-400">XP total</div>
                      <div className="text-lg font-extrabold text-white">{Number(s.xpTotal || 0).toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                      <div className="text-xs text-slate-400">XP gain</div>
                      <div className="text-lg font-extrabold text-cyan-300">{Number(s.xpGain || 0).toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                      <div className="text-xs text-slate-400">Solved</div>
                      <div className="text-lg font-extrabold text-emerald-300">{Number(s.solvedProblems || 0)}</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                      <div className="text-xs text-slate-400">Streak</div>
                      <div className="text-lg font-extrabold text-amber-300">{Number(s.streak || 0)}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 text-sm text-slate-200">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-slate-400">Activ în interval:</span>
                      <span className={cn('font-semibold', s.activeInRange ? 'text-emerald-300' : 'text-slate-300')}>{s.activeInRange ? 'DA' : 'NU'}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">Submisii:</span>
                      <span className="font-semibold text-white">{Number(s.submissions || 0)}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">Coins:</span>
                      <span className="font-semibold text-emerald-200">{Number(s.coins || 0)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorDashboardPage;















