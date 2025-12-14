type LeaderboardEntry = {
  id: number;
  rank: number;
  user: { 
    id: number;
    firstName: string; 
    lastName: string;
    avatarUrl?: string;
    level?: number;
  };
  xp: number;
};

type LeaderboardProps = {
  entries: LeaderboardEntry[];
  currentUserId?: number;
};

const LeaderboardList = ({ entries, currentUserId }: LeaderboardProps) => {
  const getAvatar = (user: LeaderboardEntry['user']) => {
    if (user.avatarUrl) return user.avatarUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(`${user.firstName} ${user.lastName}`)}&background=6366f1&color=fff&size=64`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-slate-400 bg-slate-800/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Rank</th>
            <th className="px-6 py-4 font-semibold">Student</th>
            <th className="px-6 py-4 font-semibold text-right">XP</th>
            <th className="px-6 py-4 font-semibold text-right">Level</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isCurrentUser = entry.user.id === currentUserId;
            return (
              <tr
                key={entry.id}
                className={`border-t border-slate-700/50 transition-colors ${
                  isCurrentUser
                    ? 'bg-primary-500/10 border-primary-500/30'
                    : 'hover:bg-slate-800/30'
                }`}
              >
                <td className="px-6 py-4">
                  <span className={`font-bold ${
                    isCurrentUser ? 'text-primary-400' : 'text-slate-300'
                  }`}>
                    #{entry.rank}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={getAvatar(entry.user)}
                      alt={entry.user.firstName}
                      className="w-10 h-10 rounded-full border-2 border-slate-700"
                    />
                    <div>
                      <p className={`font-medium ${
                        isCurrentUser ? 'text-primary-300' : 'text-white'
                      }`}>
                        {entry.user.firstName} {entry.user.lastName}
                      </p>
                      {isCurrentUser && (
                        <p className="text-xs text-primary-400">You</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-semibold text-primary-400">
                    {entry.xp.toLocaleString()} XP
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-slate-400">
                    Level {entry.user.level || 1}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardList;












