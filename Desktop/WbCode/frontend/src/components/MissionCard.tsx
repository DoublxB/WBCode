type Mission = {
  id: number;
  title: string;
  description: string;
  goalValue: number;
  rewardXP: number;
  participants?: number;
};

type MissionCardProps = {
  mission: Mission;
  onJoin?: (id: number) => void;
};

const MissionCard = ({ mission, onJoin }: MissionCardProps) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">Weekly Mission</p>
        <h3 className="text-xl font-semibold text-white">{mission.title}</h3>
      </div>
      <span className="rounded-full bg-primary/20 px-3 py-1 text-xs text-primary">{mission.rewardXP} XP</span>
    </div>
    <p className="mt-2 text-sm text-slate-300">{mission.description}</p>
    <p className="mt-3 text-xs text-slate-500">Goal: {mission.goalValue} actions</p>
    <p className="text-xs text-slate-500">Participants: {mission.participants ?? 0}</p>
    {onJoin && (
      <button
        onClick={() => onJoin(mission.id)}
        className="mt-4 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"
      >
        Join mission
      </button>
    )}
  </div>
);

export default MissionCard;



