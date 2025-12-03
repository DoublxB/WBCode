type LeaderboardEntry = {
  id: number;
  rank: number;
  user: { firstName: string; lastName: string };
  xp: number;
};

type LeaderboardProps = {
  entries: LeaderboardEntry[];
};

const LeaderboardList = ({ entries }: LeaderboardProps) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/70">
    <table className="w-full text-left text-sm">
      <thead className="text-slate-400">
        <tr>
          <th className="px-4 py-3">Rank</th>
          <th className="px-4 py-3">Student</th>
          <th className="px-4 py-3">XP</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id} className="border-t border-slate-800">
            <td className="px-4 py-3 font-semibold">#{entry.rank}</td>
            <td className="px-4 py-3">{`${entry.user.firstName} ${entry.user.lastName}`}</td>
            <td className="px-4 py-3 text-primary font-semibold">{entry.xp}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default LeaderboardList;



