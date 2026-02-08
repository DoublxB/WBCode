import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import SkeletonLoader from '../../components/SkeletonLoader';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { FloatingLines } from '../../components/ui/floating-lines';
import { ROADMAP_MODULES as MODULES, type RoadmapModule } from './roadmap/roadmapModules';
import {
  Lock,
  CheckCircle,
  Play,
  RotateCcw,
  ShieldAlert,
  Circle,
  Zap,
  BookOpen
} from 'lucide-react';

type ModuleState = 'LOCKED' | 'ACTIVE' | 'COMPLETED';

type ModuleProgress = {
  total: number;
  solved: number;
  isExercisesCompleted: boolean;
};

function normalizeSlugLike(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function matchesModule(ex: any, moduleSlug: string) {
  const catRaw = String(ex?.category || '').trim();
  const cat = catRaw ? normalizeSlugLike(catRaw) : '';

  // IMPORTANT: Counting must be STRICT, otherwise generic tokens like "if/for" inflate totals.
  // Our roadmap-seeded exercises have category === moduleSlug.
  if (cat === moduleSlug) return true;

  // Fallback for roadmap-seeded titles (in case category is missing for any reason)
  const title = String(ex?.title || '');
  if (title.startsWith(`[Roadmap:${moduleSlug}]`)) return true;

  return false;
}

function computeModuleProgress(exercises: any[] | undefined): Record<string, ModuleProgress> {
  const result: Record<string, ModuleProgress> = {};
  for (const m of MODULES) {
    const inModule = (exercises || []).filter((ex) => matchesModule(ex, m.slug));
    const total = inModule.length;
    const solved = inModule.filter((ex) => ex?.isSolved === true).length;
    const isExercisesCompleted = total > 0 && solved >= total;
    result[m.slug] = { total, solved, isExercisesCompleted };
  }
  return result;
}

function computeStatesFromProgress(progress: Record<string, ModuleProgress>, bossPassed: Set<string>): ModuleState[] {
  const completed = MODULES.map((m) => Boolean(progress[m.slug]?.isExercisesCompleted) && bossPassed.has(m.slug));
  const firstIncompleteIdx = completed.findIndex((c) => !c);

  return MODULES.map((_, idx) => {
    if (completed[idx]) return 'COMPLETED';
    if (firstIncompleteIdx === -1) return 'COMPLETED';
    if (idx === firstIncompleteIdx) return 'ACTIVE';
    return 'LOCKED';
  });
}

const RoadmapPage = () => {
  const navigate = useNavigate();
  const [bossModalSlug, setBossModalSlug] = useState<string | null>(null);

  const { data: exercises, isLoading, error } = useQuery({
    queryKey: ['coding'],
    queryFn: async () => {
      const { data } = await api.get('/coding');
      return data as any[];
    }
  });

  const { data: bossCompletions } = useQuery({
    queryKey: ['boss', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/boss/completions/me');
      return data as { completions: Array<{ moduleSlug: string }> };
    }
  });

  const progress = useMemo(() => computeModuleProgress(exercises), [exercises]);
  const bossPassedSet = useMemo(() => {
    const set = new Set<string>();
    for (const c of bossCompletions?.completions || []) {
      if (c?.moduleSlug) set.add(String(c.moduleSlug));
    }
    return set;
  }, [bossCompletions]);

  const states = useMemo(() => computeStatesFromProgress(progress, bossPassedSet), [progress, bossPassedSet]);
  const activeCount = useMemo(() => states.filter((s) => s === 'ACTIVE').length, [states]);
  const lockedCount = useMemo(() => states.filter((s) => s === 'LOCKED').length, [states]);

  const goToModule = (slug: string) => {
    navigate(`/codelab?category=${encodeURIComponent(slug)}`);
  };

  const goToBoss = (slug: string) => {
    navigate(`/roadmap/boss/${encodeURIComponent(slug)}`);
  };

  const goToMaterials = (slug: string) => {
    navigate(`/roadmap/materiale/${encodeURIComponent(slug)}`);
  };

  // Mobile layout (vertical, centered) — more compact
  // Needs to fit the card height + glow safely (card is 300px tall + outer glow)
  const ROW_H = 344;
  const svgHeightMobile = MODULES.length * ROW_H;
  const mobileX = 500; // straight line on mobile
  const yAtMobile = (i: number) => i * ROW_H + ROW_H / 2;
  const buildPathV = (x1: number, y1: number, x2: number, y2: number) => {
    const dy = Math.max(120, Math.min(220, (y2 - y1) / 2));
    return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
  };

  // Desktop/tablet layout (left -> right S-curve) — canvas sized to fit all cards (no clipping)
  const CARD_W = 280;
  const CARD_H = 300;
  const GAP_X = 100;
  const PAD_X = 60;
  // Safe canvas height so the lower row (and glow) never gets clipped.
  const MAP_H = 520;
  const MAP_W = PAD_X * 2 + MODULES.length * CARD_W + (MODULES.length - 1) * GAP_X;
  // Pull everything slightly higher so it fits nicely inside MAP_H.
  const baseY = 120;
  const offsetY = 96; // like mt-24 (6rem)
  const cardY = (i: number) => (i % 2 === 0 ? baseY - 40 : baseY - 40 + offsetY);
  const cardX = (i: number) => PAD_X + i * (CARD_W + GAP_X);
  const cx = (i: number) => cardX(i) + CARD_W / 2;
  const cy = (i: number) => cardY(i) + CARD_H / 2;

  const buildCircuitPathS = (x1: number, y1: number, x2: number, y2: number) => {
    const midX = (x1 + x2) / 2;
    const controlOffset = 40;
    return `
      M ${x1} ${y1}
      L ${x1 + 20} ${y1}
      C ${midX - controlOffset} ${y1}, ${midX - controlOffset} ${y1}, ${midX} ${(y1 + y2) / 2}
      C ${midX + controlOffset} ${y2}, ${midX + controlOffset} ${y2}, ${x2 - 20} ${y2}
      L ${x2} ${y2}
    `;
  };

  const renderCard = (m: RoadmapModule, idx: number) => {
    const state = states[idx];
    const Icon = m.icon;
    const isLocked = state === 'LOCKED';
    const isActive = state === 'ACTIVE';
    const isCompleted = state === 'COMPLETED';

    const p = progress[m.slug] || { total: 0, solved: 0, isExercisesCompleted: false };
    const pct = p.total > 0 ? Math.min(100, Math.round((p.solved / p.total) * 100)) : 0;
    const bossPassed = bossPassedSet.has(m.slug);
    const needsBoss = p.isExercisesCompleted && !bossPassed;

    const actionLabel = isLocked ? 'Blocat' : needsBoss ? 'Final Boss' : isCompleted ? 'Recapitulare' : 'Începe';
    const ActionIcon = isLocked ? Lock : needsBoss ? Zap : isCompleted ? RotateCcw : Play;

    const leftDotClass = isLocked
      ? 'bg-slate-800 border-slate-600'
      : isCompleted
        ? 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/50'
        : 'bg-cyan-500 border-cyan-400 shadow-lg shadow-cyan-500/50';

    const iconWrapClass = isLocked
      ? 'bg-slate-800/80 text-slate-500'
      : isCompleted
        ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/15 text-emerald-300'
        : 'bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 text-cyan-300';

    const progressBarClass = isLocked
      ? 'bg-slate-700'
      : isCompleted
        ? 'bg-gradient-to-r from-emerald-500 via-emerald-300 to-cyan-400 bg-[length:200%_100%] animate-shine'
        : 'bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500 bg-[length:200%_100%] animate-shine';

    const cardBase = cn(
      'group relative w-[280px] h-[300px] shrink-0 rounded-2xl border backdrop-blur-md overflow-hidden transition-all duration-500',
      isActive &&
        'bg-slate-900/90 border-cyan-500/50 shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-400/30 hover:border-cyan-400/70',
      isCompleted &&
        'bg-slate-900/85 border-emerald-500/40 shadow-2xl shadow-emerald-500/15 hover:border-emerald-400/60',
      isLocked &&
        'bg-slate-900/70 border-slate-700/50 hover:border-slate-600/70 hover:bg-slate-900/80 opacity-80'
    );

    return (
      <div key={m.slug} className={cn('relative item-enter')} style={{ animationDelay: `${idx * 100}ms` }}>
        {/* Outer glow for active */}
        {isActive && (
          <div className="absolute -inset-3 bg-gradient-to-r from-cyan-500/20 via-emerald-500/10 to-cyan-500/20 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
        )}

        <div className={cardBase}>
          {/* Circuit pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fillRule=\'evenodd\'%3E%3Cg fill=\'%2306b6d4\' fillOpacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
            }}
          />

          {/* Connection points left/right */}
          <div className={cn('absolute top-1/2 -left-2 w-4 h-4 rounded-full border-2 transform -translate-y-1/2', leftDotClass)}>
            <div className={cn('absolute inset-1 rounded-full', isLocked ? 'bg-slate-700' : 'bg-white/80')} />
          </div>
          <div className="absolute top-1/2 -right-2 w-4 h-4 rounded-full border-2 transform -translate-y-1/2 bg-slate-800 border-slate-600">
            <div className="absolute inset-1 rounded-full bg-slate-700" />
          </div>

          {/* Locked overlay */}
          {isLocked && (
            <div className="absolute inset-0 z-20 grid place-items-center">
              <div className="grid place-items-center rounded-2xl border border-slate-700/60 bg-slate-950/60 px-5 py-4">
                <Lock className="h-6 w-6 text-slate-200" />
                <p className="mt-2 text-xs font-semibold text-slate-200">Blocat</p>
              </div>
            </div>
          )}

          {/* Completed badge */}
          {isCompleted && (
            <div className="absolute right-4 top-4 z-20">
              <Badge variant="success">
                <CheckCircle className="h-4 w-4" />
                Mastered
              </Badge>
            </div>
          )}

          {needsBoss && (
            <div className="absolute right-4 top-4 z-20">
              <Badge variant="warning">
                <Zap className="h-4 w-4" />
                Final Boss
              </Badge>
            </div>
          )}

          <div className="relative z-10 flex h-full flex-col p-6">
            {/* Icon with energy ring */}
            <div className="relative mb-4">
              <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center relative', iconWrapClass)}>
                {!isLocked && <div className="absolute inset-0 rounded-xl ring-2 ring-cyan-500/40 animate-pulse" />}
                <Icon className="w-7 h-7" />
              </div>

              {!isLocked && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50">
                  <Zap className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Category */}
            <span className={cn('text-[10px] font-semibold tracking-[0.2em]', isLocked ? 'text-slate-600' : 'text-cyan-400/80')}>
              {m.subtitle.toUpperCase()}
            </span>

            {/* Title */}
            <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2 leading-tight">
              <span className="text-balance">{m.title}</span>
              {isLocked && <Lock className="w-4 h-4 text-slate-500 shrink-0" />}
            </h3>

            {/* Description */}
            <p className="text-sm text-slate-400 mt-3 leading-relaxed line-clamp-2">{m.description}</p>

            {/* Progress */}
            <div className="mt-auto pt-4 border-t border-slate-800/50">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-500 font-medium">Progres</span>
                <span className={cn('font-semibold', isLocked ? 'text-slate-500' : 'text-cyan-300')}>
                  {p.solved}/{p.total} exerciții
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-700', progressBarClass)} style={{ width: `${Math.max(pct, 2)}%` }} />
              </div>

              <Button
                disabled={isLocked}
                variant="secondary"
                onClick={() => goToMaterials(m.slug)}
                className={cn(
                  'mt-4 w-full py-2.5 font-semibold shadow-lg',
                  isLocked
                    ? 'bg-slate-800/60 text-slate-400 border border-slate-700/50 cursor-not-allowed'
                    : 'hover:bg-slate-800/80'
                )}
              >
                <BookOpen className="h-4 w-4" />
                Materiale
              </Button>

              <Button
                disabled={isLocked}
                onClick={() => (needsBoss ? setBossModalSlug(m.slug) : goToModule(m.slug))}
                className={cn(
                  'mt-2 w-full py-2.5 font-semibold shadow-lg',
                  isLocked
                    ? 'bg-slate-800/60 text-slate-400 border border-slate-700/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]'
                )}
              >
                <ActionIcon className="h-4 w-4" />
                {actionLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Desktop map: scale-to-fit so you don't need side (left-right) scrolling.
  // IMPORTANT: Observe a stable wrapper (no scrollbars) to avoid ResizeObserver feedback loops
  // that can cause the map to "pulse" (scale up/down).
  const desktopMeasureRef = useRef<HTMLDivElement | null>(null);
  const [desktopViewportSize, setDesktopViewportSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // LayoutEffect avoids the initial "blank" frame on first navigation (common on Windows)
  // by measuring before paint.
  useLayoutEffect(() => {
    const el = desktopMeasureRef.current;
    if (!el) return;

    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const next = { w: el.clientWidth, h: el.clientHeight };
        setDesktopViewportSize((prev) => (prev.w === next.w && prev.h === next.h ? prev : next));
      });
    });
    ro.observe(el);
    setDesktopViewportSize({ w: el.clientWidth, h: el.clientHeight });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const desktopScaleRaw = useMemo(() => {
    if (!desktopViewportSize.w || !desktopViewportSize.h) return 1;
    const availableH = Math.max(0, desktopViewportSize.h - 16);
    const sH = availableH / MAP_H;
    const clamped = Math.min(1, sH);
    // Quantize hard to kill oscillations (Windows sub-pixel + scrollbar layout)
    if (clamped > 0.995) return 1;
    return Math.round(clamped * 100) / 100;
  }, [desktopViewportSize, MAP_H]);

  // Add hysteresis so scale can't bounce (stops the left-right "pulsing" feel)
  const lastStableScaleRef = useRef<number>(1);
  const desktopScale = useMemo(() => {
    const prev = lastStableScaleRef.current;
    const next = desktopScaleRaw;
    if (Math.abs(next - prev) < 0.03) return prev;
    lastStableScaleRef.current = next;
    return next;
  }, [desktopScaleRaw]);

  return (
    <div className="relative flex flex-col gap-2 min-h-[calc(100vh-140px)]">
      {/* FloatingLines Background */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <FloatingLines
          linesGradient={["#39bd14","#2F4BC0","#47f55b"]}
          animationSpeed={1}
          interactive
          bendRadius={5}
          bendStrength={-0.5}
          mouseDamping={0.05}
          parallax
          parallaxStrength={0.2}
        />
      </div>
      {/* New integrated header (no separate container background/border) */}
      <div className="pt-1 relative z-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white">Traseul</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2 text-cyan-300">
            <Circle className="h-3.5 w-3.5 fill-cyan-400 text-cyan-400" fill="currentColor" strokeWidth={0} />
            <span className="font-semibold">{activeCount}/{MODULES.length}</span>
            <span>Module active</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Circle className="h-3.5 w-3.5 fill-slate-500 text-slate-500" fill="currentColor" strokeWidth={0} />
            <span className="font-semibold">{lockedCount}</span>
            <span>Module blocate</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 relative z-10">
          <SkeletonLoader type="card" count={3} />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200 flex items-start gap-3 relative z-10">
          <ShieldAlert className="h-5 w-5 mt-0.5" />
          <div>
            <p className="font-semibold text-white">Nu pot încărca progresul Roadmap</p>
            <p className="text-sm text-rose-200/80">Verifică dacă backend-ul rulează și ești logat.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop/tablet: left -> right S-curve map (full-width, no inner “box”) */}
          <div className="hidden md:block -mx-6 md:-mx-8 flex-1 min-h-0 -mt-1">
            <div ref={desktopMeasureRef} className="w-full h-full min-h-0">
              <div className="w-full h-full min-h-0 overflow-x-auto overflow-y-hidden scrollbar-hide">
                <div
                  className="relative mx-auto"
                  style={{
                    width: MAP_W * desktopScale,
                    height: MAP_H * desktopScale
                  }}
                >
                  <div
                    className="absolute left-0 top-0 isolate"
                    style={{
                      width: MAP_W,
                      height: MAP_H,
                      transform: `scale(${desktopScale})`,
                      transformOrigin: 'top left'
                    }}
                  >
                <svg className="pointer-events-none absolute inset-0 z-0" width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
                  <defs>
                    <linearGradient id="activePathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="50%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>

                    <filter id="circuitGlow" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>

                    <filter id="nodeGlow" x="-200%" y="-200%" width="500%" height="500%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="blur" />
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {MODULES.slice(0, -1).map((_, i) => {
                    const isCompleted = states[i] === 'COMPLETED';
                    const isActive = states[i] === 'ACTIVE';

                    const start = { x: cx(i), y: cy(i) };
                    const end = { x: cx(i + 1), y: cy(i + 1) };

                    const x1 = start.x + CARD_W / 2 + 8;
                    const y1 = start.y;
                    const x2 = end.x - CARD_W / 2 - 8;
                    const y2 = end.y;
                    const midX = (x1 + x2) / 2;

                    const pathD = buildCircuitPathS(x1, y1, x2, y2);
                    const isHot = isCompleted || isActive;

                    const strokeMain = isCompleted ? 'url(#activePathGradient)' : isActive ? 'rgba(6,182,212,0.75)' : '#334155';
                    const strokeWidth = isCompleted ? 4 : isActive ? 3.5 : 3;

                    return (
                      <g key={i}>
                        {isCompleted && (
                          <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="20" opacity="0.1" strokeLinecap="round" />
                        )}

                        <path
                          d={pathD}
                          fill="none"
                          stroke={strokeMain}
                          strokeWidth={strokeWidth}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray={isHot ? 'none' : '12 8'}
                          filter={isHot ? 'url(#circuitGlow)' : undefined}
                        />

                        {isCompleted && (
                          <circle r="5" fill="#10b981" filter="url(#nodeGlow)">
                            <animateMotion dur="2s" repeatCount="indefinite" path={pathD} />
                            <animate attributeName="r" values="3;5;3" dur="0.5s" repeatCount="indefinite" />
                          </circle>
                        )}

                        <circle
                          cx={midX}
                          cy={(y1 + y2) / 2}
                          r={isHot ? 10 : 8}
                          fill="#0f172a"
                          stroke={isHot ? '#06b6d4' : '#334155'}
                          strokeWidth={isHot ? 3 : 2}
                          filter={isHot ? 'url(#nodeGlow)' : undefined}
                        />
                        <circle cx={midX} cy={(y1 + y2) / 2} r={isHot ? 4 : 3} fill={isHot ? '#06b6d4' : '#475569'} />
                      </g>
                    );
                  })}
                </svg>

                {MODULES.map((m, idx) => (
                  <div key={m.slug} className="absolute z-10" style={{ left: cardX(idx), top: cardY(idx) }}>
                    {renderCard(m, idx)}
                  </div>
                ))}
                  </div>
              </div>
            </div>
            </div>
          </div>

          {/* Mobile: vertical centered */}
          <div className="md:hidden relative w-full max-w-5xl mx-auto -mt-1 z-10">
            <svg
              className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
              width="1000"
              height={svgHeightMobile}
              viewBox={`0 0 1000 ${svgHeightMobile}`}
            >
              <defs>
              <linearGradient id="energyM" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(16,185,129,0.92)" />
                <stop offset="50%" stopColor="rgba(34,197,94,0.92)" />
                <stop offset="100%" stopColor="rgba(110,231,183,0.86)" />
                </linearGradient>
              </defs>
              {MODULES.slice(0, -1).map((_, i) => {
                const fromCompleted = states[i] === 'COMPLETED';
                const path = buildPathV(mobileX, yAtMobile(i), mobileX, yAtMobile(i + 1));
                return (
                  <g key={i}>
                    <path
                      d={path}
                      fill="none"
                      stroke={fromCompleted ? 'url(#energyM)' : 'rgba(51,65,85,0.7)'}
                      strokeWidth={10}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.9}
                    />
                    {fromCompleted && (
                      <path
                        d={path}
                        fill="none"
                        stroke="rgba(240,253,244,0.32)"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="6 14"
                        opacity={0.9}
                        className="animate-circuit-flow"
                      />
                    )}
                    {fromCompleted && (
                      <path
                        d={path}
                        fill="none"
                        stroke="rgba(34,197,94,0.95)"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="10 48"
                        opacity={0.95}
                        className="animate-circuit-signal"
                      />
                    )}
                    <circle cx={mobileX} cy={yAtMobile(i)} r={11} fill={fromCompleted ? 'rgba(16,185,129,0.16)' : 'rgba(148,163,184,0.08)'} stroke="rgba(100,116,139,0.35)" strokeWidth={1.5} />
                    <circle cx={mobileX} cy={yAtMobile(i + 1)} r={11} fill={fromCompleted ? 'rgba(16,185,129,0.16)' : 'rgba(148,163,184,0.08)'} stroke="rgba(100,116,139,0.35)" strokeWidth={1.5} />
                    <circle cx={mobileX} cy={yAtMobile(i)} r={5.6} fill={fromCompleted ? 'rgba(34,197,94,0.95)' : 'rgba(148,163,184,0.40)'} stroke="rgba(100,116,139,0.35)" strokeWidth={3} />
                    <circle cx={mobileX} cy={yAtMobile(i + 1)} r={5.6} fill={fromCompleted ? 'rgba(34,197,94,0.95)' : 'rgba(148,163,184,0.40)'} stroke="rgba(100,116,139,0.35)" strokeWidth={3} />
                  </g>
                );
              })}
            </svg>

            <div className="relative flex flex-col items-center" style={{ height: svgHeightMobile }}>
              {MODULES.map((m, idx) => (
                <div key={m.slug} className="w-full flex justify-center" style={{ height: ROW_H }}>
                  {renderCard(m, idx)}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Final Boss modal */}
      {bossModalSlug && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4" style={{ zIndex: 50 }}>
          <div className="w-[min(520px,92vw)] rounded-2xl border border-amber-500/25 bg-slate-950/70 backdrop-blur-xl p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/25">
                <Zap className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-[0.22em] text-amber-300/80">FINAL BOSS</div>
                <div className="text-xl font-bold text-white">{bossModalSlug}</div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <div>• 8 quiz-uri grele (minim 70% fiecare)</div>
              <div>• 2 probleme de reparat (BUGFIX)</div>
              <div>• 2 probleme de rezolvat (SOLVE)</div>
              <div className="text-slate-400 mt-2">Timp total: <span className="font-semibold text-slate-100">45:00</span></div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setBossModalSlug(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-slate-900/40 text-slate-200 font-semibold hover:bg-slate-900/60"
              >
                Închide
              </button>
              <button
                onClick={() => {
                  const slug = bossModalSlug;
                  setBossModalSlug(null);
                  goToBoss(slug);
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold shadow-lg shadow-cyan-500/20 btn-press"
              >
                Începe testarea
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapPage;


