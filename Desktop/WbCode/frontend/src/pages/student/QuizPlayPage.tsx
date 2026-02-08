import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import QuizRunner from '../../components/QuizRunner';
import { ArrowLeft, Clock, FileQuestion } from 'lucide-react';
import type { TrackQuizDifficulty } from '../../data/quiz-tracks';
import { recommendedQuizTimeLimitSeconds } from '../../data/quiz-tracks';

type QuizDetail = {
  id: number;
  title: string;
  description: string;
  timeLimit: number;
  lesson?: {
    difficulty: string;
    tags: string[];
    title: string;
  };
  questions: Array<{
    id: number;
    prompt: string;
    options: string[];
    explanation: string;
  }>;
};

type LocationState = {
  from?: string;
  trackDifficulty?: TrackQuizDifficulty;
  trackStepTitle?: string;
};

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const QuizPlayPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { quizId } = useParams();

  const state = (location.state || {}) as LocationState;
  const numericQuizId = Number(quizId);

  const { data: quiz, isLoading } = useQuery<QuizDetail | null>({
    queryKey: ['quiz', numericQuizId],
    queryFn: async () => {
      if (!numericQuizId) return null;
      const { data } = await api.get(`/quizzes/${numericQuizId}`);
      return data;
    },
    enabled: Number.isFinite(numericQuizId) && numericQuizId > 0
  });

  const effectiveTimeLimit = useMemo(() => {
    if (!quiz) return 0;

    // If launched from a track step, use our recommended time (difficulty-aware)
    if (state.trackDifficulty) {
      return recommendedQuizTimeLimitSeconds(quiz.questions?.length || 0, state.trackDifficulty);
    }

    // Otherwise, keep backend timeLimit (existing behavior)
    return quiz.timeLimit;
  }, [quiz, state.trackDifficulty]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-10 text-center text-slate-300">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
        <p className="mt-4">Se încarcă quiz-ul...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-3xl">
        <button
          onClick={() => (state.from ? navigate(state.from) : navigate('/quizzes'))}
          className="btn-press inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900/60"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi
        </button>
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/20 p-6 text-slate-300">
          Quiz-ul nu a fost găsit.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (state.from ? navigate(state.from) : navigate('/quizzes'))}
            className="btn-press inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900/60"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <FileQuestion className="h-4 w-4 text-blue-300" />
            <span className="text-sm font-semibold text-white">{state.trackStepTitle || quiz.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2">
          <Clock className="h-4 w-4 text-amber-300" />
          <span className="text-sm font-semibold text-slate-100">{formatTime(effectiveTimeLimit)}</span>
          <span className="text-xs text-slate-400">timp</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/20">
        <QuizRunner
          quizId={quiz.id}
          quizTitle={quiz.title}
          questions={quiz.questions.map((q: any) => ({
            id: q.id,
            prompt: q.prompt,
            options: q.options || [],
            explanation: q.explanation
          }))}
          timeLimit={effectiveTimeLimit}
          onSubmit={async (answers) => {
            const payload = {
              answers: Object.entries(answers).map(([questionId, answer]) => ({
                questionId: Number(questionId),
                answer
              }))
            };
            const { data } = await api.post(`/quizzes/${quiz.id}/submit`, payload);
            return data;
          }}
        />
      </div>
    </div>
  );
};

export default QuizPlayPage;





