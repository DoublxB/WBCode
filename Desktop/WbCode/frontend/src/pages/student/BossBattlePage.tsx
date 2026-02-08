import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import CodeEditor from '../../components/CodeEditor';
import { ArrowLeft, Clock, Crown, FileQuestion, Play, Terminal, Trophy, XCircle, CheckCircle, Sparkles } from 'lucide-react';
import Confetti from '../../components/Confetti';
import { ROADMAP_MODULES } from './roadmap/roadmapModules';
import { useProfile } from '../../api/hooks';

type BossStep =
  | { type: 'QUIZ'; quizId: number; title: string }
  | { type: 'CODING'; codingId: number; title: string; mode: 'BUGFIX' | 'SOLVE' };

type BossDefinition = {
  moduleSlug: string;
  title: string;
  timeLimitSec: number;
  unlocked: boolean;
  isPassed: boolean;
  passedAt: string | null;
  steps: BossStep[];
};

type QuizDetail = {
  id: number;
  title: string;
  description: string;
  questions: Array<{ id: number; prompt: string; options: string[]; explanation: string }>;
};

type CodingExercise = {
  id: number;
  title: string;
  prompt: string;
  starterCode: string;
  difficulty: string;
  language: 'C' | 'CPP' | 'PYTHON';
};

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function BossBattlePage() {
  const navigate = useNavigate();
  const { moduleSlug } = useParams();
  const slug = String(moduleSlug || '').trim().toLowerCase();
  const { data: profile } = useProfile();

  const [hasStarted, setHasStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [failed, setFailed] = useState<string | null>(null);
  const [passed, setPassed] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);

  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const { data: boss, isLoading: bossLoading } = useQuery<BossDefinition | null>({
    queryKey: ['boss', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data } = await api.get(`/boss/tests/${encodeURIComponent(slug)}`);
      return data;
    },
    enabled: Boolean(slug)
  });

  const currentStep = boss?.steps?.[stepIndex] ?? null;

  // Timer tick
  useEffect(() => {
    if (!hasStarted) return;
    if (timeRemaining <= 0) return;
    if (failed || passed) return;

    timerRef.current = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setFailed('Timp expirat. Final Boss FAILED.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [hasStarted, timeRemaining, failed, passed]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const startBoss = () => {
    if (!boss) return;
    setHasStarted(true);
    setFailed(null);
    setPassed(false);
    setStepIndex(0);
    setTimeRemaining(boss.timeLimitSec);
    startedAtRef.current = Date.now();
  };

  const completeBoss = useMutation({
    mutationFn: async () => {
      if (!slug) return null;
      const { data } = await api.post(`/boss/tests/${encodeURIComponent(slug)}/complete`, { passed: true });
      return data;
    }
  });

  const isAdmin = profile?.role === 'ADMIN';

  const handleAdminComplete = () => {
    if (!boss) return;
    setFailed(null);
    setHasStarted(true);
    setStepIndex(boss.steps.length);
    setTimeRemaining(0);
    setPassed(true);
    setShowUnlock(true);
    completeBoss.mutate();
  };

  const totalSteps = boss?.steps?.length || 0;
  const progressPct = totalSteps ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0;

  const headerTitle = useMemo(() => {
    if (!boss) return 'Final Boss';
    return `Final Boss • ${boss.moduleSlug}`;
  }, [boss]);

  const nextModule = useMemo(() => {
    const idx = ROADMAP_MODULES.findIndex((m) => m.slug === slug);
    if (idx === -1) return null;
    return ROADMAP_MODULES[idx + 1] || null;
  }, [slug]);

  // ---- Quiz step state ----
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const quizId = currentStep?.type === 'QUIZ' ? currentStep.quizId : null;
  const { data: quiz, isLoading: quizLoading } = useQuery<QuizDetail | null>({
    queryKey: ['boss-quiz', quizId],
    queryFn: async () => {
      if (!quizId) return null;
      const { data } = await api.get(`/quizzes/${quizId}`);
      return data;
    },
    enabled: hasStarted && Boolean(quizId)
  });

  const submitQuiz = useMutation({
    mutationFn: async () => {
      if (!quizId) return null;
      const payload = {
        answers: Object.entries(quizAnswers).map(([questionId, answer]) => ({
          questionId: Number(questionId),
          answer
        }))
      };
      const { data } = await api.post(`/quizzes/${quizId}/submit`, payload);
      return data as { score: number; maxScore: number };
    },
    onSuccess: (res) => {
      if (!res) return;
      const pct = res.maxScore ? res.score / res.maxScore : 0;
      if (pct < 0.7) {
        setFailed('Ai picat un quiz din Final Boss (minim 70%).');
        return;
      }
      setQuizAnswers({});
      setStepIndex((i) => i + 1);
    }
  });

  // ---- Coding step state ----
  const [code, setCode] = useState('');
  const [stdin, setStdin] = useState('');
  const [terminalOpen, setTerminalOpen] = useState(true);
  const codingId = currentStep?.type === 'CODING' ? currentStep.codingId : null;
  const { data: coding, isLoading: codingLoading } = useQuery<CodingExercise | null>({
    queryKey: ['boss-coding', codingId],
    queryFn: async () => {
      if (!codingId) return null;
      const { data } = await api.get(`/coding/${codingId}`);
      return data;
    },
    enabled: hasStarted && Boolean(codingId)
  });

  useEffect(() => {
    if (!coding) return;
    setCode(coding.starterCode || '');
    setStdin('');
  }, [coding?.id]);

  const runCode = useMutation({
    mutationFn: async () => {
      if (!codingId) return null;
      const { data } = await api.post(`/coding/${codingId}/submit`, {
        sourceCode: code,
        stdin
      });
      return data as { success: boolean; score: number; stdout?: string; stderr?: string; xpGain?: number };
    }
  });

  const submitCodeStep = () => {
    if (runCode.isPending) return;
    runCode.mutate(undefined, {
      onSuccess: (res) => {
        if (!res) return;
        if (res.score !== 100) {
          setFailed('Problema de cod nu e corectă (trebuie 100%). Final Boss FAILED.');
          return;
        }
        setStepIndex((i) => i + 1);
      }
    });
  };

  // When finished all steps
  useEffect(() => {
    if (!hasStarted || !boss) return;
    if (failed) return;
    if (stepIndex < boss.steps.length) return;

    setPassed(true);
    setShowUnlock(true);
    completeBoss.mutate();
  }, [hasStarted, boss, stepIndex, failed]);

  if (bossLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-10 text-center text-slate-300">
        Se încarcă Final Boss...
      </div>
    );
  }

  if (!boss) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-10 text-center text-slate-300">
        Final Boss indisponibil.
      </div>
    );
  }

  if (!boss.unlocked) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-10 text-center text-slate-300">
        <div className="mx-auto max-w-xl space-y-3">
          <div className="text-white font-semibold">Final Boss este blocat</div>
          <div className="text-sm text-slate-400">
            Trebuie să termini toate problemele din modul înainte să poți începe testarea.
          </div>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/roadmap')}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-900/40 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900/60"
            >
              Înapoi la Roadmap
            </button>
            {isAdmin && (
              <button
                onClick={handleAdminComplete}
                className="inline-flex items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25"
              >
                Admin: Finalizează Boss
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-110px)] flex flex-col overflow-hidden">
      {showUnlock && passed && (
        <>
          <Confetti count={80} duration={3200} />
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="relative w-[min(620px,92vw)] rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-950/90 p-8 shadow-2xl">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent -translate-x-full animate-shine pointer-events-none" />
              <div className="relative flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-400/30 grid place-items-center">
                  <Trophy className="h-7 w-7 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold tracking-[0.22em] text-emerald-300/80">FINAL BOSS PASSED</div>
                  <div className="text-2xl font-bold text-white mt-1">Felicitări! Ai deblocat următorul modul.</div>
                  {nextModule ? (
                    <div className="mt-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                      <div className="flex items-center gap-2 text-sm text-cyan-200">
                        <Sparkles className="h-4 w-4" />
                        Modul nou
                      </div>
                      <div className="text-lg font-semibold text-white mt-1">{nextModule.title}</div>
                      <div className="text-sm text-slate-400">{nextModule.subtitle}</div>
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-slate-400">Ai terminat toate modulele Roadmap.</div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowUnlock(false);
                    navigate('/roadmap');
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold shadow-lg shadow-cyan-500/20"
                >
                  Vezi Roadmap
                </button>
                <button
                  onClick={() => setShowUnlock(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-slate-900/40 text-slate-200 font-semibold hover:bg-slate-900/60"
                >
                  Închide
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/roadmap')}
            className="p-2 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-300" />
            <span className="text-sm font-semibold text-white">{headerTitle}</span>
          </div>
          {hasStarted && (
            <>
              <div className="h-4 w-px bg-white/10" />
              <div className="text-xs text-slate-300">
                Pas <span className="font-semibold text-white">{Math.min(stepIndex + 1, totalSteps)}</span>/{totalSteps}{' '}
                <span className="text-slate-500">({progressPct}%)</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={handleAdminComplete}
              className="px-3 py-1.5 rounded-md border border-emerald-400/30 bg-emerald-500/15 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25"
            >
              Admin: Finalizează Boss
            </button>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-amber-500/30 bg-amber-500/10">
            <Clock className="h-4 w-4 text-amber-300" />
            <span className="text-sm font-mono font-semibold text-amber-200">
              {formatTime(hasStarted ? timeRemaining : boss.timeLimitSec)}
            </span>
          </div>
        </div>
      </header>

      {/* Start overlay */}
      {!hasStarted && (
        <div className="flex-1 grid place-items-center">
          <div className="max-w-md w-[min(520px,90vw)] rounded-2xl border border-amber-500/20 bg-slate-950/60 backdrop-blur-xl p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/25">
                <Crown className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-[0.22em] text-amber-300/80">FINAL BOSS</div>
                <div className="text-xl font-bold text-white">{boss.moduleSlug}</div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <div>• 8 quiz-uri grele (minim 70% fiecare)</div>
              <div>• 2 probleme de reparat (BUGFIX)</div>
              <div>• 2 probleme de rezolvat (SOLVE)</div>
              <div className="text-slate-400 mt-2">Timp total: <span className="font-semibold text-slate-100">{formatTime(boss.timeLimitSec)}</span></div>
            </div>

            <button
              onClick={startBoss}
              className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold shadow-lg shadow-cyan-500/20 btn-press"
            >
              <Play className="h-4 w-4" />
              Începe testarea
            </button>
          </div>
        </div>
      )}

      {/* Main runner */}
      {hasStarted && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel */}
          <div className="w-[40%] flex flex-col border-r border-white/5 bg-slate-900/30">
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {failed ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <XCircle className="h-5 w-5 text-rose-300" />
                    Final Boss FAILED
                  </div>
                  <p className="mt-2 text-sm text-rose-200/90">{failed}</p>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => navigate('/roadmap')}
                      className="px-4 py-2 rounded-lg border border-white/10 bg-slate-900/40 text-slate-200 font-semibold hover:bg-slate-900/60"
                    >
                      Înapoi la Roadmap
                    </button>
                    <button
                      onClick={startBoss}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold hover:from-cyan-400 hover:to-emerald-400"
                    >
                      Reîncearcă
                    </button>
                  </div>
                </div>
              ) : passed ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-emerald-200">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <Trophy className="h-5 w-5 text-emerald-300" />
                    Final Boss PASSED
                  </div>
                  <p className="mt-2 text-sm text-emerald-200/90">
                    Ai deblocat următorul modul.
                  </p>
                  <button
                    onClick={() => navigate('/roadmap')}
                    className="mt-4 px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600"
                  >
                    Înapoi la Roadmap
                  </button>
                </div>
              ) : currentStep?.type === 'QUIZ' ? (
                <>
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.22em] text-cyan-300/80">
                    <FileQuestion className="h-4 w-4" />
                    QUIZ
                  </div>
                  <h1 className="mt-3 text-2xl font-bold text-white">{currentStep.title}</h1>
                  <p className="mt-2 text-sm text-slate-300">Răspunde corect la minim 70% ca să treci mai departe.</p>
                </>
              ) : currentStep?.type === 'CODING' ? (
                <>
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.22em] text-amber-300/80">
                    <Terminal className="h-4 w-4" />
                    {currentStep.mode}
                  </div>
                  <h1 className="mt-3 text-2xl font-bold text-white">{coding?.title || currentStep.title}</h1>
                  <p className="mt-4 text-sm text-slate-300 whitespace-pre-wrap">{coding?.prompt || ''}</p>
                </>
              ) : (
                <div className="text-slate-300">Se încarcă pasul...</div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 flex flex-col bg-slate-950">
            {!currentStep ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">Se încarcă...</div>
            ) : currentStep.type === 'QUIZ' ? (
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {quizLoading ? (
                  <div className="text-slate-300">Se încarcă quiz-ul...</div>
                ) : !quiz ? (
                  <div className="text-slate-300">Quiz indisponibil.</div>
                ) : (
                  <div className="max-w-3xl space-y-6">
                    {quiz.questions.map((q, idx) => (
                      <div key={q.id} className="rounded-2xl border border-white/5 bg-slate-900/30 p-5">
                        <div className="text-xs text-slate-400">Întrebarea {idx + 1}</div>
                        <div className="mt-1 text-white font-semibold">{q.prompt}</div>
                        <div className="mt-3 space-y-2">
                          {(q.options || []).map((opt) => {
                            const selected = quizAnswers[q.id] === opt;
                            return (
                              <button
                                key={opt}
                                onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                                className={[
                                  'w-full text-left rounded-xl border px-4 py-3 text-sm transition',
                                  selected
                                    ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100'
                                    : 'border-white/5 bg-slate-950/30 text-slate-200 hover:bg-slate-900/40'
                                ].join(' ')}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => submitQuiz.mutate()}
                      disabled={submitQuiz.isPending}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold shadow-lg shadow-cyan-500/20 btn-press disabled:opacity-50"
                    >
                      {submitQuiz.isPending ? 'Se trimite...' : 'Trimite quiz-ul'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-hidden">
                  <CodeEditor
                    language="python"
                    value={code}
                    onChange={(v) => setCode(v)}
                  />
                </div>

                <div className="border-t border-white/5 bg-slate-900/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Terminal className="h-4 w-4" />
                      stdin (opțional / dacă e nevoie)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTerminalOpen((s) => !s)}
                        className="px-3 py-2 rounded-lg border border-white/10 bg-slate-900/40 text-slate-200 text-sm font-semibold hover:bg-slate-900/60"
                      >
                        {terminalOpen ? 'Ascunde' : 'Arată'} output
                      </button>
                      <button
                        onClick={submitCodeStep}
                        disabled={!code.trim() || runCode.isPending}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50"
                      >
                        {runCode.isPending ? 'Se verifică...' : 'Submit'}
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    placeholder="Ex:\n2\n3"
                    className="mt-3 w-full h-24 rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm font-mono text-slate-100"
                  />

                  {terminalOpen && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase">
                        {runCode.data?.score === 100 ? (
                          <CheckCircle className="h-4 w-4 text-emerald-300" />
                        ) : runCode.data?.score !== undefined ? (
                          <XCircle className="h-4 w-4 text-rose-300" />
                        ) : (
                          <Terminal className="h-4 w-4 text-slate-400" />
                        )}
                        Output
                      </div>
                      <pre className="mt-2 text-xs text-slate-200 font-mono whitespace-pre-wrap">
                        {runCode.data
                          ? `score: ${runCode.data.score}\n\nstdout:\n${runCode.data.stdout || ''}\n\nstderr:\n${runCode.data.stderr || ''}`
                          : 'Rulează și apasă Submit ca să treci pasul.'}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


