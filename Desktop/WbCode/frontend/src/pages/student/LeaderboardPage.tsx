import { useLeaderboard, useProfile } from '../../api/hooks';
import LeaderboardList from '../../components/LeaderboardList';
import LeaderboardPodium from '../../components/LeaderboardPodium';
import SkeletonLoader from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import { Trophy, Users } from 'lucide-react';

const LeaderboardPage = () => {
  const { data: leaderboard, isLoading } = useLeaderboard();
  const { data: profile } = useProfile();

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
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary-500/20">
            <Trophy className="h-6 w-6 text-primary-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Friendly rivalry</p>
            <h1 className="text-3xl font-semibold text-white">Leaderboard</h1>
          </div>
        </div>
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












