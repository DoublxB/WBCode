import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMissions, useProfile } from '../../api/hooks';
import { api } from '../../api/client';
import {
  Target,
  Clock,
  Trophy,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Activity,
  Zap
} from 'lucide-react';

interface MissionParticipant {
  userId: number;
  progress: number;
  completed: boolean;
  rewardClaimed?: boolean;
}

interface Mission {
  id: number;
  title: string;
  description: string;
  goalType: 'QUIZZES' | 'CODING' | 'XP' | string;
  goalValue: number;
  rewardXP: number;
  startDate: string;
  endDate: string;
  participants?: MissionParticipant[];
}

const MissionSolvePage = () => {
  const { id } = useParams<{ id: string }>();
  const missionId = id ? parseInt(id, 10) : NaN;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: missions, isLoading } = useMissions();

  const [showToast, setShowToast] = useState<string | null>(null);
  const [progressInput, setProgressInput] = useState<number>(1);

  const mission: Mission | undefined = useMemo(
    () => (Array.isArray(missions) ? (missions.find((m: any) => m.id === missionId) as Mission | undefined) : undefined),
    [missions, missionId]
  );

  const participant = useMemo(
    () =>
      mission && profile
        ? mission.participants?.find((p) => p.userId === profile.id) ?? null
        : null,
    [mission, profile]
  );

  const addProgress = useMutation({
    mutationFn: async (amount: number) => {
      if (!missionId || Number.isNaN(missionId)) return;
      const { data } = await api.post(`/missions/${missionId}/progress`, {
        progress: amount
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      setShowToast('Progres actualizat pentru misiune!');
      setTimeout(() => setShowToast(null), 2500);
    }
  });

  const claimReward = useMutation({
    mutationFn: async () => {
      if (!missionId || Number.isNaN(missionId)) return;
      const { data } = await api.post(`/missions/${missionId}/claim`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      setShowToast('Reward claimed!');
      setTimeout(() => setShowToast(null), 2500);
    }
  });

  const handleQuickProgress = (amount: number) => {
    if (!mission || !profile) return;
    addProgress.mutate(amount);
  };

  const handleCustomProgress = () => {
    if (!mission || !profile || !progressInput || progressInput <= 0) return;
    addProgress.mutate(progressInput);
  };

  const handleGoToPractice = () => {
    if (!mission) return;
    if (mission.goalType === 'CODING') {
      navigate('/code-lab');
    } else if (mission.goalType === 'QUIZZES') {
      navigate('/quizzes');
    } else {
      navigate('/');
    }
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
  };

  const getTimeRemaining = () => {
    if (!mission) return null;
    const now = new Date();
    const end = new Date(mission.endDate);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Mission ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    if (days > 0) return `${days}d ${hours}h left`;
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    return `${hours}h ${mins}m left`;
  };

  const getGoalLabel = () => {
    if (!mission) return '';
    switch (mission.goalType) {
      case 'QUIZZES':
        return `${mission.goalValue} quiz-uri finalizate`;
      case 'CODING':
        return `${mission.goalValue} probleme de codare rezolvate`;
      case 'XP':
        return `${mission.goalValue} XP câștigate`;
      default:
        return `${mission.goalValue} acțiuni`;
    }
  };

  const timeRemaining = getTimeRemaining();
  const currentProgress = participant?.progress ?? 0;
  const completionPercent = mission ? Math.min(100, (currentProgress / mission.goalValue) * 100) : 0;

  useEffect(() => {
    if (!Number.isNaN(missionId) && missions && !mission && !isLoading) {
      // If mission not found in active list, go back to missions page
      navigate('/missions');
    }
  }, [missionId, mission, missions, isLoading, navigate]);

  if (Number.isNaN(missionId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Invalid mission</div>
      </div>
    );
  }

  if (isLoading || !missions || !mission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading mission...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-500/90 px-5 py-3 text-sm font-semibold text-white shadow-xl animate-slide-in">
          <CheckCircle2 className="h-4 w-4" />
          {showToast}
        </div>
      )}

      {/* Sticky header */}
      <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/missions')}
              className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to missions
            </button>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/15 p-2">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Weekly Mission
                </p>
                <h1 className="text-sm font-semibold text-white md:text-base">
                  {mission.title}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 sm:flex">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>{timeRemaining}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 border border-emerald-500/40">
              <Trophy className="h-4 w-4" />
              +{mission.rewardXP} XP
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
          {/* Left: Mission details & progress */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 md:p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.14),_transparent_55%)]" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                      Mission Objective
                    </p>
                    <h2 className="text-xl font-bold text-white md:text-2xl">
                      {mission.title}
                    </h2>
                    <p className="text-xs text-slate-300 md:text-sm">
                      {mission.description}
                    </p>
                  </div>
                  {participant?.completed && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="h-4 w-4" />
                        Completed
                      </div>
                      <button
                        onClick={() => claimReward.mutate()}
                        disabled={claimReward.isPending || participant.rewardClaimed}
                        className="rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-1.5 text-xs font-bold text-white hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {participant.rewardClaimed ? 'Claimed' : claimReward.isPending ? 'Claiming...' : 'Claim Reward'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Goal
                    </p>
                    <p className="text-sm font-semibold text-white">{getGoalLabel()}</p>
                  </div>
                  <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Your progress
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {currentProgress} / {mission.goalValue}
                    </p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Time window
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {formatDate(mission.startDate)} – {formatDate(mission.endDate)}
                    </p>
                    <p className="text-[11px] text-slate-400">{timeRemaining}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress controls */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-sky-500/20 p-2">
                    <Activity className="h-4 w-4 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Update your mission progress</p>
                    <p className="text-xs text-slate-400">
                      Marchează ce ai lucrat azi ca să îți ții streak-ul și să deblochezi XP-ul.
                    </p>
                  </div>
                </div>
                <span className="hidden rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-300 md:inline-flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-400" />
                  {mission.goalType}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-end">
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 5, 10].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleQuickProgress(val)}
                      disabled={addProgress.isPending}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-primary/70 hover:bg-slate-800/80 transition-colors disabled:opacity-60"
                    >
                      <ArrowRight className="h-3 w-3 text-primary" />
                      +{val}{' '}
                      {mission.goalType === 'XP'
                        ? 'XP'
                        : mission.goalType === 'QUIZZES'
                        ? 'quiz'
                        : 'task'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={progressInput}
                    onChange={(e) => setProgressInput(parseInt(e.target.value || '1', 10))}
                    className="h-9 w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 text-sm text-white focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={handleCustomProgress}
                    disabled={addProgress.isPending || !progressInput || progressInput <= 0}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-60"
                  >
                    {addProgress.isPending ? 'Updating...' : 'Add progress'}
                  </button>
                </div>
              </div>

              {participant?.completed && (
                <div className="mt-1 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-300" />
                  <span>
                    Felicitări! Ai finalizat misiunea săptămânii și ai primit{' '}
                    <span className="font-semibold">{mission.rewardXP} XP</span>.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: CTA & stats */}
          <div className="space-y-4 md:space-y-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-purple-500/20 p-2">
                  <Target className="h-4 w-4 text-purple-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-300">
                    Start grinding
                  </p>
                  <p className="text-sm text-slate-300">
                    Deschide zona de învățare potrivită și începe să strângi progres pentru misiune.
                  </p>
                </div>
              </div>

              <button
                onClick={handleGoToPractice}
                className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-primary to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/40 hover:from-primary/90 hover:to-purple-600/90 transition-all"
              >
                <span>
                  {mission.goalType === 'CODING'
                    ? 'Go to CodeLab'
                    : mission.goalType === 'QUIZZES'
                    ? 'Go to Quiz Hub'
                    : 'Back to Dashboard'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-[11px] text-slate-400">
                Progresul tău se adună pe toată durata săptămânii. Revino aici oricând să vezi cât mai
                ai până la reward.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-slate-800 p-2">
                    <Activity className="h-4 w-4 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Mission stats
                    </p>
                    <p className="text-sm font-semibold text-white">Community progress</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] text-slate-300">
                  {mission.participants?.length ?? 0} participants
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Your completion</span>
                  <span className="font-semibold text-slate-100">
                    {Math.round(completionPercent)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-emerald-400 to-amber-400 transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-400">
                  <li>✔ Misiunile sunt resetate săptămânal – nu rata fereastra de timp.</li>
                  <li>✔ XP-ul câștigat aici te ajută la leaderboard și la deblocarea badge-urilor.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionSolvePage;





