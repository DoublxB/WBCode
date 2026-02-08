export type Mission = {
  id: number;
  title: string;
  description: string;
  goalType?: string;
  goalValue: number;
  rewardXP: number;
  participants?: number;
  codingExerciseId?: number | null;
  myParticipant?: {
    userId: number;
    progress: number;
    completed: boolean;
    rewardClaimed?: boolean;
  } | null;
};

type MissionCardProps = {
  mission: Mission;
  onOpen?: (mission: Mission) => void;
  onClaim?: (mission: Mission) => void;
};

const MissionCard = ({ mission, onOpen, onClaim }: MissionCardProps) => {
  const progress = mission.myParticipant?.progress ?? 0;
  const completed = mission.myParticipant?.completed ?? false;
  const claimed = mission.myParticipant?.rewardClaimed ?? false;

  const canClaim = completed && !claimed;

  return (
    <div className="group relative rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-blue-600/10 to-blue-500/10 backdrop-blur-sm p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-blue-400/50 hover:scale-[1.02] overflow-hidden">
    {/* Shine effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
    
    <div className="relative flex items-center justify-between mb-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-indigo-400 font-bold mb-1">🎯 Weekly Mission</p>
        <h3 className="text-xl font-bold text-white drop-shadow-lg">{mission.title}</h3>
      </div>
      <span className="rounded-full bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-400/50 px-4 py-1.5 text-sm font-bold text-yellow-300 shadow-lg">
        +{mission.rewardXP} XP
      </span>
    </div>
    <p className="mt-2 text-sm text-slate-300 mb-4">{mission.description}</p>
    <div className="flex items-center gap-4 mb-4 text-xs">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <span className="text-slate-400">Goal:</span>
        <span className="text-white font-semibold">{mission.goalValue} actions</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <span className="text-slate-400">👥</span>
        <span className="text-white font-semibold">{mission.participants ?? 0} participants</span>
      </div>
    </div>
    <div className="mb-4">
      <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
        <span>Progress</span>
        <span className="font-mono">{Math.min(progress, mission.goalValue)}/{mission.goalValue}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800/60 border border-slate-700/40 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
          style={{ width: `${Math.min(100, Math.round((Math.min(progress, mission.goalValue) / mission.goalValue) * 100))}%` }}
        />
      </div>
      {completed && (
        <div className="mt-2 text-xs font-semibold">
          {claimed ? (
            <span className="text-emerald-400">Reward claimed ✅</span>
          ) : (
            <span className="text-amber-300">Completed — claim your reward 🎁</span>
          )}
        </div>
      )}
    </div>

    <div className="flex gap-3">
      {onOpen && (
        <button
          onClick={() => onOpen(mission)}
          className="btn-press group/btn relative flex-1 rounded-lg bg-slate-900/60 border border-slate-700/50 px-4 py-3 text-sm font-bold text-white hover:bg-slate-900/80 transition-all shadow-lg"
        >
          <span className="relative z-10">Open</span>
        </button>
      )}
      {onClaim && (
        <button
          onClick={() => onClaim(mission)}
          disabled={!canClaim}
          className="btn-press group/btn relative flex-1 rounded-lg bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-500 px-4 py-3 text-sm font-bold text-white hover:from-emerald-600 hover:via-green-700 hover:to-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
          <span className="relative z-10">Claim Reward</span>
        </button>
      )}
    </div>
  </div>
  );
};

export default MissionCard;













