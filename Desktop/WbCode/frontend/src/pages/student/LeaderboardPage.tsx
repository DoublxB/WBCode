import { useLeaderboard, useProfile, useLeaderboardPeriod } from '../../api/hooks';
import LeaderboardList from '../../components/LeaderboardList';
import LeaderboardPodium from '../../components/LeaderboardPodium';
import SkeletonLoader from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import { Trophy, Users, Clock } from 'lucide-react';

const LeaderboardPage = () => {
  const { data: leaderboard, isLoading } = useLeaderboard();
  const { data: profile } = useProfile();
  const { data: periodInfo } = useLeaderboardPeriod();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" count={3} />
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <p className="text-sm text-slate-400">Friendly rivalry</p>
          <h1 className="text-3xl font-semibold text-white">Leaderboard</h1>
        </header>
        <EmptyState
          icon={Trophy}
          title="No leaderboard data"
          description="The leaderboard will appear once students start earning XP."
        />
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/20">
              <Trophy className="h-6 w-6 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Friendly rivalry</p>
              <h1 className="text-3xl font-semibold text-white">Leaderboard</h1>
            </div>
          </div>
          {periodInfo && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 border border-primary-500/30">
              <Clock className="h-4 w-4 text-primary-400" />
              <div className="text-right">
                <p className="text-xs text-slate-400">Perioadă curentă</p>
                <p className="text-sm font-semibold text-primary-400">
                  {periodInfo.daysRemaining} zile rămase
                </p>
              </div>
            </div>
          )}
        </div>
        {periodInfo && (
          <div className="mt-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <p className="text-xs text-slate-400">
              Leaderboard-ul se resetează la fiecare 30 de zile. Perioada curentă: {periodInfo.daysElapsed}/30 zile.
              {periodInfo.daysRemaining > 0 && (
                <span className="text-primary-400 ml-1">
                  Resetare în {periodInfo.daysRemaining} zile.
                </span>
              )}
            </p>
          </div>
        )}
      </header>

      {/* Podium for Top 3 */}
      {topThree.length >= 3 && (
        <LeaderboardPodium
          topThree={topThree}
          currentUserId={profile?.id}
        />
      )}

      {/* Rest of Leaderboard */}
      {rest.length > 0 && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-white">All Rankings</h2>
            </div>
          </div>
          <LeaderboardList entries={rest} currentUserId={profile?.id} />
        </div>
      )}

      {/* Your Position (if not in top 10) */}
      {profile && leaderboard.findIndex((entry: any) => entry.user.id === profile.id) >= 10 && (
        <div className="rounded-2xl border-2 border-primary-500/50 bg-primary-500/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Your Position</p>
              <p className="text-2xl font-bold text-white">
                #{leaderboard.find((entry: any) => entry.user.id === profile.id)?.rank || 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400 mb-1">Your XP</p>
              <p className="text-2xl font-bold text-primary-400">
                {profile.xp?.toLocaleString() || 0} XP
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;












