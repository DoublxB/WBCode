import { useLeaderboard } from '../../api/hooks';
import LeaderboardList from '../../components/LeaderboardList';

const LeaderboardPage = () => {
  const { data } = useLeaderboard();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-400">Friendly rivalry</p>
        <h1 className="text-3xl font-semibold text-white">Leaderboard</h1>
      </header>
      {data && <LeaderboardList entries={data} />}
    </div>
  );
};

export default LeaderboardPage;



