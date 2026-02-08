import { useState } from 'react';
import StatCard from '../../components/StatCard';
import ProgressChart from '../../components/ProgressChart';
import StreakCalendar from '../../components/StreakCalendar';
import CollapsibleSection from '../../components/CollapsibleSection';
import Tooltip from '../../components/Tooltip';
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
  Activity,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  BookOpen,
  Sparkles
} from 'lucide-react';

type TabType = 'overview' | 'performance' | 'achievements';

const StudentDashboard = () => {
  const { data: profile } = useProfile();
  const { data: lessons } = useLessons();
  const { data: leaderboard } = useLeaderboard();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showAllStats, setShowAllStats] = useState(false);

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-800 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const mainStats = [
    {
      title: "XP",
      value: profile?.xp ?? 0,
      subtitle: `+${stats?.xpGainedToday ?? 0} today`,
      icon: Zap,
      color: "success" as const,
      trend: "up" as const,
      trendValue: `+${stats?.xpGainedThisWeek ?? 0} this week`,
      tooltip: "Experience points earned by completing exercises, quizzes, and challenges. Level up every 100 XP."
    },
    {
      title: "Level",
      value: profile?.level ?? 1,
      subtitle: "Level up every 100 XP",
      icon: TrendingUp,
      color: "primary" as const,
      tooltip: "Your current level based on total XP. Higher levels unlock new features and badges."
    },
    {
      title: "Active streak",
      value: `${stats?.currentStreak ?? 0} days`,
      subtitle: `Longest: ${stats?.longestStreak ?? 0} days`,
      icon: Flame,
      color: "warning" as const,
      tooltip: "Consecutive days of activity. Maintain your streak to earn bonus XP!"
    },
    {
      title: "Rank",
      value: `#${stats?.leaderboardRank ?? 'N/A'}`,
      subtitle: `of ${stats?.leaderboardTotal ?? 0} students`,
      icon: Trophy,
      color: "info" as const,
      tooltip: "Your position on the global leaderboard. Compete with other students!"
    }
  ];

  const performanceStats = [
    {
      title: "Typing Speed",
      value: `${stats?.averageTypingSpeed ?? 0} WPM`,
      subtitle: "Average words per minute",
      icon: Code,
      color: "primary" as const,
      tooltip: "Average typing speed measured during coding exercises. Higher speed = more efficient coding."
    },
    {
      title: "Problems Today",
      value: stats?.problemsSolvedToday ?? 0,
      subtitle: `${stats?.problemsSolvedThisWeek ?? 0} this week`,
      icon: Target,
      color: "success" as const,
      trend: "up" as const,
      tooltip: "Number of coding problems solved today. Keep practicing to improve!"
    },
    {
      title: "Accuracy Rate",
      value: `${stats?.accuracyRate ?? 0}%`,
      subtitle: "Correct submissions",
      icon: CheckCircle,
      color: "success" as const,
      tooltip: "Percentage of correct submissions. Focus on quality over quantity."
    },
    {
      title: "Time Spent",
      value: `${stats?.timeSpentToday ?? 0} min`,
      subtitle: `${stats?.timeSpentThisWeek ?? 0} min this week`,
      icon: Clock,
      color: "info" as const,
      tooltip: "Total time spent coding today. Consistent practice leads to improvement."
    }
  ];

  const detailedStats = [
    {
      title: "Total Problems",
      value: stats?.problemsSolvedTotal ?? 0,
      subtitle: "All time solved",
      icon: Code,
      color: "primary" as const
    },
    {
      title: "Unique Solved",
      value: stats?.uniqueProblemsSolved ?? 0,
      subtitle: "Distinct problems",
      icon: Target,
      color: "success" as const
    },
    {
      title: "First Try",
      value: stats?.firstTryCount ?? 0,
      subtitle: "Solved on first attempt",
      icon: Sparkles,
      color: "warning" as const
    },
    {
      title: "Lessons Read",
      value: stats?.lessonsReadCount ?? 0,
      subtitle: "Marked as read",
      icon: BookOpen,
      color: "secondary" as const
    },
    {
      title: "Quizzes Today",
      value: stats?.quizzesCompletedToday ?? 0,
      subtitle: `${stats?.quizzesCompletedThisWeek ?? 0} this week`,
      icon: BarChart3,
      color: "secondary" as const
    },
    {
      title: "Challenges Won",
      value: `${stats?.challengesWon ?? 0}/${stats?.challengesTotal ?? 0}`,
      subtitle: "Win rate",
      icon: Award,
      color: "warning" as const
    },
    {
      title: "Challenge Win %",
      value: `${stats?.challengeWinRate ?? 0}%`,
      subtitle: "Completed challenges",
      icon: Trophy,
      color: "info" as const
    },
    {
      title: "Active Days",
      value: `${stats?.activeDaysThisWeek ?? 0}/7`,
      subtitle: "This week",
      icon: Activity,
      color: "success" as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/20 via-blue-600/15 to-blue-500/15 p-6 md:p-8 shadow-2xl">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl animate-float" />
        </div>
        
        <div className="relative z-10">
          <p className="text-sm text-slate-300 mb-1 font-medium">Welcome back</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
            {profile?.firstName}, ready to push your streak?
          </h1>
          <p className="text-slate-200">
            You've solved <span className="font-semibold text-green-400 drop-shadow-lg">{stats?.problemsSolvedToday ?? 0}</span> problems today and gained{' '}
            <span className="font-semibold text-amber-400 drop-shadow-lg">+{stats?.xpGainedToday ?? 0} XP</span>
          </p>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/5">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-semibold transition-colors relative ${
            activeTab === 'overview'
              ? 'text-blue-400'
              : 'text-zinc-400 hover:text-zinc-300'
          }`}
        >
          Overview
          {activeTab === 'overview' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2 text-sm font-semibold transition-colors relative ${
            activeTab === 'performance'
              ? 'text-blue-400'
              : 'text-zinc-400 hover:text-zinc-300'
          }`}
        >
          Performance
          {activeTab === 'performance' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-4 py-2 text-sm font-semibold transition-colors relative ${
            activeTab === 'achievements'
              ? 'text-blue-400'
              : 'text-zinc-400 hover:text-zinc-300'
          }`}
        >
          Achievements
          {activeTab === 'achievements' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main Stats Grid */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {mainStats.map((stat, index) => (
              <div key={index} className="relative group">
                <StatCard 
                  title={
                    <div className="flex items-center gap-1.5">
                      {stat.title}
                      {stat.tooltip && (
                        <Tooltip content={stat.tooltip} position="top">
                          <Info className="h-3 w-3 text-zinc-500 hover:text-zinc-400 cursor-help" />
                        </Tooltip>
                      )}
                    </div>
                  }
                  value={stat.value} 
                  subtitle={stat.subtitle}
                  icon={stat.icon}
                  color={stat.color}
                  trend={stat.trend}
                  trendValue={stat.trendValue}
                />
              </div>
            ))}
          </div>

          {/* Performance Stats - Collapsible */}
          <CollapsibleSection
            title="Performance Metrics"
            defaultOpen={false}
            icon={<BarChart3 className="h-4 w-4 text-blue-400" />}
            badge={performanceStats.length}
          >
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mt-4">
              {performanceStats.map((stat, index) => (
                <div key={index} className="relative group">
                  <StatCard 
                    title={
                      <div className="flex items-center gap-1.5">
                        {stat.title}
                        {stat.tooltip && (
                          <Tooltip content={stat.tooltip} position="top">
                            <Info className="h-3 w-3 text-zinc-500 hover:text-zinc-400 cursor-help" />
                          </Tooltip>
                        )}
                      </div>
                    }
                    value={stat.value} 
                    subtitle={stat.subtitle}
                    icon={stat.icon}
                    color={stat.color}
                    trend={stat.trend}
                  />
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Detailed Stats - Show More */}
          {!showAllStats && (
            <button
              onClick={() => setShowAllStats(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-white/5 bg-zinc-900/30 hover:bg-zinc-900/50 text-zinc-400 hover:text-white transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Show more statistics</span>
            </button>
          )}

          {showAllStats && (
            <CollapsibleSection
              title="Detailed Statistics"
              defaultOpen={true}
              icon={<Activity className="h-4 w-4 text-amber-400" />}
            >
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mt-4">
                {detailedStats.map((stat, index) => (
                  <StatCard 
                    key={index}
                    title={stat.title}
                    value={stat.value} 
                    subtitle={stat.subtitle}
                    icon={stat.icon}
                    color={stat.color}
                  />
                ))}
              </div>
              <button
                onClick={() => setShowAllStats(false)}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/5 bg-zinc-900/30 hover:bg-zinc-900/50 text-zinc-400 hover:text-white transition-colors text-sm"
              >
                <EyeOff className="h-4 w-4" />
                <span>Show less</span>
              </button>
            </CollapsibleSection>
          )}

          {/* Progress Chart - Collapsible */}
          <CollapsibleSection
            title="Weekly Progress"
            defaultOpen={false}
            icon={<TrendingUp className="h-4 w-4 text-green-400" />}
          >
            <div className="mt-4">
              <ProgressChart
                labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                values={[10, 50, 75, 120, profile?.xp ?? 0, (profile?.xp ?? 0) + 40, (profile?.xp ?? 0) + 60]}
              />
            </div>
          </CollapsibleSection>

          {/* Lessons & Leaderboard */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <CollapsibleSection
                title="Recent Lessons"
                defaultOpen={true}
                icon={<span className="text-lg">📚</span>}
                badge={lessons?.length ?? 0}
              >
                <div className="space-y-3 mt-4">
                  {lessons?.slice(0, 3).map((lesson: any, index: number) => (
                    <div 
                      key={lesson.id} 
                      className="group/lesson rounded-xl border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-4 hover:border-blue-400/50 hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-blue-600/10 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs uppercase text-blue-400 font-semibold px-2 py-1 rounded-full bg-blue-500/20">{lesson.difficulty}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1 group-hover/lesson:text-blue-300 transition-colors">{lesson.title}</h3>
                      <p className="text-sm text-slate-400 group-hover/lesson:text-slate-300 transition-colors">{lesson.description}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
              
              <CollapsibleSection
                title="Leaderboard Snapshot"
                defaultOpen={false}
                icon={<Trophy className="h-4 w-4 text-amber-400" />}
                badge={leaderboard?.length ?? 0}
              >
                <div className="space-y-2 mt-4">
                  {leaderboard?.slice(0, 5).map((entry: any, index: number) => (
                    <div 
                      key={entry.id} 
                      className="group/entry flex items-center justify-between rounded-lg bg-gradient-to-r from-slate-900/80 to-slate-800/60 px-4 py-3 hover:from-amber-500/20 hover:to-orange-500/20 transition-all duration-300 cursor-pointer hover:scale-[1.02] border border-transparent hover:border-amber-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold w-8 ${
                          entry.rank === 1 ? 'text-yellow-400' :
                          entry.rank === 2 ? 'text-slate-300' :
                          entry.rank === 3 ? 'text-amber-600' :
                          'text-slate-400'
                        }`}>
                          #{entry.rank}
                        </span>
                        <span className="text-sm text-slate-200 font-medium group-hover/entry:text-white transition-colors">
                          {entry.user.firstName} {entry.user.lastName}
                        </span>
                      </div>
                      <span className="text-amber-400 font-bold group-hover/entry:text-yellow-300 transition-colors drop-shadow-lg">
                        {entry.xp.toLocaleString()} XP
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            </div>
            
            <div className="md:col-span-1">
              <StreakCalendar />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {performanceStats.map((stat, index) => (
              <div key={index} className="relative group">
                <StatCard 
                  title={
                    <div className="flex items-center gap-1.5">
                      {stat.title}
                      {stat.tooltip && (
                        <Tooltip content={stat.tooltip} position="top">
                          <Info className="h-3 w-3 text-zinc-500 hover:text-zinc-400 cursor-help" />
                        </Tooltip>
                      )}
                    </div>
                  }
                  value={stat.value} 
                  subtitle={stat.subtitle}
                  icon={stat.icon}
                  color={stat.color}
                  trend={stat.trend}
                />
              </div>
            ))}
          </div>

          <CollapsibleSection
            title="Weekly Progress Chart"
            defaultOpen={true}
            icon={<TrendingUp className="h-4 w-4 text-green-400" />}
          >
            <div className="mt-4">
              <ProgressChart
                labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                values={[10, 50, 75, 120, profile?.xp ?? 0, (profile?.xp ?? 0) + 40, (profile?.xp ?? 0) + 60]}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Detailed Performance Metrics"
            defaultOpen={false}
            icon={<BarChart3 className="h-4 w-4 text-blue-400" />}
          >
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mt-4">
              {detailedStats.map((stat, index) => (
                <StatCard 
                  key={index}
                  title={stat.title}
                  value={stat.value} 
                  subtitle={stat.subtitle}
                  icon={stat.icon}
                  color={stat.color}
                />
              ))}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/5 bg-zinc-900/30 p-6 text-center">
            <Trophy className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Achievements Coming Soon</h3>
            <p className="text-zinc-400 text-sm">
              Track your badges, milestones, and special accomplishments here.
            </p>
          </div>

          <CollapsibleSection
            title="Current Streak"
            defaultOpen={true}
            icon={<Flame className="h-4 w-4 text-amber-400" />}
          >
            <div className="mt-4">
              <StreakCalendar />
            </div>
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
