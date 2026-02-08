import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
  id: number;
  rank: number;
  xp: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    level?: number;
  };
}

interface LeaderboardPodiumProps {
  topThree: LeaderboardEntry[];
  currentUserId?: number;
}

const LeaderboardPodium = ({ topThree, currentUserId }: LeaderboardPodiumProps) => {
  if (topThree.length < 3) return null;

  const [first, second, third] = topThree;

  const getAvatar = (user: LeaderboardEntry['user']) => {
    if (user.avatarUrl) return user.avatarUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(`${user.firstName} ${user.lastName}`)}&background=6366f1&color=fff&size=128`;
  };

  return (
    <div className="mb-8">
      <div className="flex items-end justify-center gap-4 max-w-2xl mx-auto">
        {/* Second Place */}
        <div className="flex-1 flex flex-col items-center animate-fade-in">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full border-4 border-slate-700 overflow-hidden bg-slate-800">
              <img
                src={getAvatar(second.user)}
                alt={second.user.firstName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center border-2 border-slate-800 shadow-lg">
              <Medal className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="w-full bg-gradient-to-b from-slate-600 to-slate-700 rounded-t-2xl p-4 text-center border-2 border-slate-600 shadow-xl" style={{ height: '120px' }}>
            <div className="text-2xl font-bold text-white mb-1">#{second.rank}</div>
            <div className="text-sm font-semibold text-slate-200 mb-2">
              {second.user.firstName} {second.user.lastName}
            </div>
            <div className="text-lg font-bold text-slate-100">{second.xp.toLocaleString()} XP</div>
            {second.user.level && (
              <div className="text-xs text-slate-300 mt-1">Level {second.user.level}</div>
            )}
          </div>
        </div>

        {/* First Place */}
        <div className="flex-1 flex flex-col items-center animate-fade-in-delayed">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse-slow" />
            <div className="relative w-28 h-28 rounded-full border-4 border-yellow-500 overflow-hidden bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-2xl">
              <img
                src={getAvatar(first.user)}
                alt={first.user.firstName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border-4 border-slate-800 shadow-xl">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 px-3 py-1 rounded-full border-2 border-slate-800 shadow-lg">
              <span className="text-xs font-bold text-white">#1</span>
            </div>
          </div>
          <div className="w-full bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-t-2xl p-5 text-center border-2 border-yellow-400 shadow-2xl" style={{ height: '160px' }}>
            <div className="text-3xl font-bold text-white mb-1">#{first.rank}</div>
            <div className="text-base font-bold text-white mb-2">
              {first.user.firstName} {first.user.lastName}
            </div>
            <div className="text-2xl font-bold text-white mb-1">{first.xp.toLocaleString()} XP</div>
            {first.user.level && (
              <div className="text-sm text-yellow-100 mt-1">Level {first.user.level}</div>
            )}
          </div>
        </div>

        {/* Third Place */}
        <div className="flex-1 flex flex-col items-center animate-fade-in">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full border-4 border-amber-700 overflow-hidden bg-slate-800">
              <img
                src={getAvatar(third.user)}
                alt={third.user.firstName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center border-2 border-slate-800 shadow-lg">
              <Award className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="w-full bg-gradient-to-b from-amber-700 to-amber-800 rounded-t-2xl p-4 text-center border-2 border-amber-600 shadow-xl" style={{ height: '100px' }}>
            <div className="text-2xl font-bold text-white mb-1">#{third.rank}</div>
            <div className="text-sm font-semibold text-amber-100 mb-2">
              {third.user.firstName} {third.user.lastName}
            </div>
            <div className="text-lg font-bold text-amber-50">{third.xp.toLocaleString()} XP</div>
            {third.user.level && (
              <div className="text-xs text-amber-200 mt-1">Level {third.user.level}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPodium;








