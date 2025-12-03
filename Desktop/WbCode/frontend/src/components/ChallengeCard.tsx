type Challenge = {
  id: number;
  challenger: string;
  opponent: string;
  status: string;
  codingExercise: string;
  bonusXP: number;
};

type ChallengeCardProps = {
  challenge: Challenge;
  onAccept?: (id: number) => void;
};

const ChallengeCard = ({ challenge, onAccept }: ChallengeCardProps) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
    <div className="flex items-center justify-between text-sm text-slate-400">
      <span>{challenge.codingExercise}</span>
      <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase">{challenge.status}</span>
    </div>
    <p className="mt-2 text-lg text-white">
      {challenge.challenger} vs {challenge.opponent}
    </p>
    <p className="text-xs text-slate-500">Bonus: {challenge.bonusXP} XP</p>
    {onAccept && challenge.status === 'PENDING' && (
      <button onClick={() => onAccept(challenge.id)} className="mt-3 rounded-lg bg-accent px-3 py-2 text-sm font-semibold">
        Accept challenge
      </button>
    )}
  </div>
);

export default ChallengeCard;



