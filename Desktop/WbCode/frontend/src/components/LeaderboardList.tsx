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
    // ALBASTRU pentru avatar-uri (bază)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(`${user.firstName} ${user.lastName}`)}&background=3B82F6&color=fff&size=64`;
  };

  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 backdrop-blur-sm p-4 shadow-xl">
      <table className="w-full text-left text-sm">
        <thead className="text-slate-300 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg">
          <tr>
            <th className="px-6 py-4 font-bold">Rank</th>
            <th className="px-6 py-4 font-bold">Student</th>
            <th className="px-6 py-4 font-bold text-right">XP</th>
            <th className="px-6 py-4 font-bold text-right">Level</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const isCurrentUser = entry.user.id === currentUserId;
            const rankColor = 
              entry.rank === 1 ? 'text-yellow-400' :
              entry.rank === 2 ? 'text-slate-300' :
              entry.rank === 3 ? 'text-amber-600' :
              'text-slate-400';
            
            return (
              <tr
                key={entry.id}
                className={`group border-t border-slate-700/50 transition-all duration-300 ${
                  isCurrentUser
                    ? 'bg-gradient-to-r from-blue-500/20 via-blue-600/20 to-blue-500/20 border-blue-500/40 shadow-lg'
                    : 'hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/10 hover:border-amber-500/30'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-6 py-4">
                  <span className={`font-extrabold text-lg ${rankColor} ${
                    entry.rank <= 3 ? 'drop-shadow-lg' : ''
                  }`}>
                    #{entry.rank}
                    {entry.rank === 1 && ' 🥇'}
                    {entry.rank === 2 && ' 🥈'}
                    {entry.rank === 3 && ' 🥉'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={getAvatar(entry.user)}
                        alt={entry.user.firstName}
                        className={`w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                          isCurrentUser 
                            ? 'border-blue-400 shadow-lg shadow-blue-500/50' 
                            : 'border-slate-700 group-hover:border-amber-500/50'
                        }`}
                      />
                      {isCurrentUser && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-slate-900 animate-pulse" />
                      )}
                    </div>
                    <div>
                      <p className={`font-semibold transition-colors ${
                        isCurrentUser ? 'text-blue-300' : 'text-white group-hover:text-amber-300'
                      }`}>
                        {entry.user.firstName} {entry.user.lastName}
                      </p>
                      {isCurrentUser && (
                        <p className="text-xs text-blue-400 font-bold">✨ You ✨</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-bold text-lg transition-colors ${
                    isCurrentUser 
                      ? 'text-blue-400' 
                      : 'text-amber-400 group-hover:text-yellow-300'
                  } drop-shadow-lg`}>
                    {entry.xp.toLocaleString()} XP
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                    isCurrentUser
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-slate-700/50 text-slate-300 group-hover:bg-amber-500/20 group-hover:text-amber-300'
                  }`}>
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












