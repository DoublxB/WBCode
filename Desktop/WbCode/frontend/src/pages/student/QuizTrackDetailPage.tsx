import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FolderKanban, Play, Sparkles } from 'lucide-react';
import { api } from '../../api/client';
import { getDifficultyMeta, getTrackBySlug } from '../../data/quiz-tracks';

const DifficultyBars = ({ bars, tone }: { bars: 1 | 2 | 3; tone: 'easy' | 'medium' | 'hard' }) => {
  const activeClass =
    tone === 'easy'
      ? 'bg-emerald-400'
      : tone === 'medium'
      ? 'bg-amber-400'
      : 'bg-rose-400';

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-2 w-5 rounded-sm ${i <= bars ? activeClass : 'bg-slate-700/60'}`}
        />
      ))}
    </div>
  );
};

type QuizListItem = {
  id: number;
  title: string;
  description: string;
  timeLimit: number;
  lesson?: { difficulty: string; tags: string[]; title: string };
  questions: Array<{ id: number }>;
};

function normalizeText(input: string) {
  return (input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreTitleMatch(trackTitleRo: string, backendTitle: string) {
  const a = normalizeText(trackTitleRo);
  const b = normalizeText(backendTitle);
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (b.includes(a)) return 80;
  if (a.includes(b)) return 70;

  const aTokens = new Set(a.split(' ').filter((t) => t.length >= 3));
  const bTokens = new Set(b.split(' ').filter((t) => t.length >= 3));
  let overlap = 0;
  for (const t of aTokens) {
    if (bTokens.has(t)) overlap += 1;
  }
  // overlap-weighted fallback
  return overlap * 10;
}

function findBestQuizMatchId(trackTitleRo: string, quizzes: QuizListItem[]) {
  let bestId: number | null = null;
  let bestScore = 0;

  for (const q of quizzes) {
    const s = scoreTitleMatch(trackTitleRo, q.title);
    if (s > bestScore) {
      bestScore = s;
      bestId = q.id;
    }
  }

  // Threshold: avoid accidental wrong links
  if (bestScore >= 60) return bestId;
  return null;
}

const QuizTrackDetailPage = () => {
  const navigate = useNavigate();
  const { categorySlug } = useParams();

  const track = useMemo(() => (categorySlug ? getTrackBySlug(categorySlug) : null), [categorySlug]);

  const { data: quizzes = [] } = useQuery<QuizListItem[]>({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const { data } = await api.get('/quizzes');
      return data;
    }
  });

  if (!track) {
    return (
      <div className="max-w-3xl">
        <button
          onClick={() => navigate('/quizzes')}
          className="btn-press inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900/60"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi la Quiz-uri
        </button>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
          <p className="text-sm text-slate-300">
            Categoria pe care o cauți nu există (încă). Verifică link-ul sau revino la lista de track-uri.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <button
            onClick={() => navigate('/quizzes')}
            className="btn-press inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900/60"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
              <FolderKanban className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">{track.titleRo}</h1>
              <p className="text-sm text-slate-300">{track.subtitleRo}</p>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
          <Sparkles className="h-4 w-4 text-amber-300" />
          <div className="text-right">
            <p className="text-xs text-slate-400">Nivel recomandat</p>
            <p className="text-sm font-semibold text-slate-100">{track.levelRo}</p>
          </div>
        </div>
      </div>

      {/* Linear progression list */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/25 p-5 sm:p-6">
        <div className="relative pl-12 sm:pl-14">
          <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/40 via-slate-700/40 to-transparent" />

          <div className="space-y-4">
            {track.quizzes.map((q, idx) => {
              const meta = getDifficultyMeta(q.difficulty);
              const matchedQuizId = findBestQuizMatchId(q.titleRo, quizzes);
              const canStart = Boolean(matchedQuizId);
              const toneBadge =
                meta.tone === 'easy'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : meta.tone === 'medium'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300';

              return (
                <div
                  key={q.slug}
                  className="item-enter flex items-start gap-4"
                  style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}
                >
                  {/* Step badge (in normal flow, no overlap) */}
                  <div className="flex-shrink-0 pt-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-500/40 bg-slate-950 text-xs font-bold text-blue-300 shadow-lg shadow-blue-500/10">
                      {idx + 1}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!matchedQuizId) return;
                      navigate(`/quizzes/play/${matchedQuizId}`, {
                        state: {
                          from: `/quizzes/${track.slug}`,
                          trackDifficulty: q.difficulty,
                          trackStepTitle: q.titleRo
                        }
                      });
                    }}
                    disabled={!canStart}
                    className={`btn-press group block flex-1 relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:p-5 transition-colors text-left ${
                      canStart ? 'hover:bg-slate-950/55' : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {/* Subtle hover shine (only on hover, no infinite animation) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-white">{q.titleRo}</h3>
                        <p className="mt-1 text-sm text-slate-300">{q.descriptionRo}</p>
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                          {canStart ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-2 py-1 text-blue-200">
                              <Play className="h-3.5 w-3.5" />
                              Pornește quiz-ul
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/40 px-2 py-1 text-slate-300">
                              În curând
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${toneBadge}`}>
                          {meta.labelRo}
                        </div>
                        <DifficultyBars bars={meta.bars} tone={meta.tone} />
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-300">
          <span className="font-semibold text-white">Pro tip:</span> mergi în ordine. Track‑urile sunt gândite să crească gradual
          dificultatea, ca să ai progres stabil (și XP constant).
        </div>
      </div>
    </div>
  );
};

export default QuizTrackDetailPage;


