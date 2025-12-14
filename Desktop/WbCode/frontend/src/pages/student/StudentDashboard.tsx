import StatCard from '../../components/StatCard';
import ProgressChart from '../../components/ProgressChart';
import StreakCalendar from '../../components/StreakCalendar';
import { useLessons, useLeaderboard, useProfile, useDashboardStats } from '../../api/hooks';
import { 
  Zap, 
  TrendingUp, 
  Flame, 
  Trophy, 
  Code, 
  Target, 
  Clock, 
  Award,
  CheckCircle,
  BarChart3,
  Activity
} from 'lucide-react';

const StudentDashboard = () => {
  const { data: profile } = useProfile();
  const { data: lessons } = useLessons();
  const { data: leaderboard } = useLeaderboard();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-800 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-primary/10 via-purple-500/10 to-indigo-500/10 p-6 md:p-8">
        <div className="relative z-10">
          <p className="text-sm text-slate-400 mb-1">Welcome back</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {profile?.firstName}, ready to push your streak?
          </h1>
          <p className="text-slate-300">
            You've solved <span className="font-semibold text-primary-400">{stats?.problemsSolvedToday ?? 0}</span> problems today and gained{' '}
            <span className="font-semibold text-success-400">+{stats?.xpGainedToday ?? 0} XP</span>
          </p>
        </div>
      </header>
      {/* Main Stats Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard 
          title="XP" 
          value={profile?.xp ?? 0} 
          subtitle={`+${stats?.xpGainedToday ?? 0} today`}
          icon={Zap}
          color="success"
          trend="up"
          trendValue={`+${stats?.xpGainedThisWeek ?? 0} this week`}
        />
        <StatCard 
          title="Level" 
          value={profile?.level ?? 1} 
          subtitle="Level up every 100 XP"
          icon={TrendingUp}
          color="primary"
        />
        <StatCard 
          title="Active streak" 
          value={`${stats?.currentStreak ?? 0} days`}
          subtitle={`Longest: ${stats?.longestStreak ?? 0} days`}
          icon={Flame}
          color="warning"
        />
        <StatCard 
          title="Rank" 
          value={`#${stats?.leaderboardRank ?? 'N/A'}`}
          subtitle={`of ${stats?.leaderboardTotal ?? 0} students`}
          icon={Trophy}
          color="info"
        />
      </div>

      {/* Performance Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard 
          title="Typing Speed" 
          value={`${stats?.averageTypingSpeed ?? 0} WPM`}
          subtitle="Average words per minute"
          icon={Code}
          color="primary"
        />
        <StatCard 
          title="Problems Today" 
          value={stats?.problemsSolvedToday ?? 0}
          subtitle={`${stats?.problemsSolvedThisWeek ?? 0} this week`}
          icon={Target}
          color="success"
          trend="up"
        />
        <StatCard 
          title="Accuracy Rate" 
          value={`${stats?.accuracyRate ?? 0}%`}
          subtitle="Correct submissions"
          icon={CheckCircle}
          color="success"
        />
        <StatCard 
          title="Time Spent" 
          value={`${stats?.timeSpentToday ?? 0} min`}
          subtitle={`${stats?.timeSpentThisWeek ?? 0} min this week`}
          icon={Clock}
          color="info"
        />
      </div>

      {/* Activity Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard 
          title="Total Problems" 
          value={stats?.problemsSolvedTotal ?? 0}
          subtitle="All time solved"
          icon={Code}
          color="primary"
        />
        <StatCard 
          title="Quizzes Today" 
          value={stats?.quizzesCompletedToday ?? 0}
          subtitle={`${stats?.quizzesCompletedThisWeek ?? 0} this week`}
          icon={BarChart3}
          color="secondary"
        />
        <StatCard 
          title="Challenges Won" 
          value={`${stats?.challengesWon ?? 0}/${stats?.challengesTotal ?? 0}`}
          subtitle="Win rate"
          icon={Award}
          color="warning"
        />
        <StatCard 
          title="Active Days" 
          value={`${stats?.activeDaysThisWeek ?? 0}/7`}
          subtitle="This week"
          icon={Activity}
          color="success"
        />
      </div>
      <ProgressChart
        labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
        values={[10, 50, 75, 120, profile?.xp ?? 0, (profile?.xp ?? 0) + 40, (profile?.xp ?? 0) + 60]}
      />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-2">Lessons</h2>
            <p className="text-sm text-slate-400 mb-4">Continue the structured path curated by your professor.</p>
            <div className="space-y-3">
              {lessons?.slice(0, 3).map((lesson: any) => (
                <div key={lesson.id} className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 hover:border-primary/50 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs uppercase text-slate-500 font-semibold">{lesson.difficulty}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{lesson.title}</h3>
                  <p className="text-sm text-slate-400">{lesson.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-2">Leaderboard snapshot</h2>
            <p className="text-sm text-slate-400 mb-4">Friendly competition keeps streaks alive.</p>
            <div className="space-y-2">
              {leaderboard?.slice(0, 5).map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between rounded-lg bg-slate-900/50 px-4 py-3 hover:bg-slate-900/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-400 w-8">#{entry.rank}</span>
                    <span className="text-sm text-slate-200 font-medium">{entry.user.firstName} {entry.user.lastName}</span>
                  </div>
                  <span className="text-primary font-semibold">{entry.xp.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="md:col-span-1">
          <StreakCalendar />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;



