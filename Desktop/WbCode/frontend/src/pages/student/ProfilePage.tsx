import { FormEvent, useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useProfile, useDashboardStats, useLeaderboard, useFriends } from '../../api/hooks';
import { api } from '../../api/client';
import { authStore } from '../../store/auth.store';
import BadgeGrid from '../../components/BadgeGrid';
import ActivityGraph from '../../components/ActivityGraph';
import StreakCalendar from '../../components/StreakCalendar';
import StatCard from '../../components/StatCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import ProgressChart from '../../components/ProgressChart';
import {
  Trophy,
  Award,
  TrendingUp,
  Target,
  User,
  Settings,
  Download,
  Share2,
  Calendar,
  Clock,
  Code,
  FileQuestion,
  Sword,
  Users,
  Zap,
  Flame,
  BarChart3,
  TrendingDown,
  CheckCircle,
  XCircle,
  Star,
  Crown,
  Medal,
  Gift,
  Sparkles,
  Edit3,
  Save,
  X
} from 'lucide-react';

const avatars = [
  'https://placekitten.com/200/200',
  'https://placebear.com/200/200',
  'https://placehold.co/200x200?text=WB'
];

const titles = [
  'Novice Coder',
  'Algorithm Explorer',
  'Bug Basher',
  'AI Whisperer',
  'Code Master',
  'Python Wizard',
  'Problem Solver',
  'Logic Architect'
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { data: profile, refetch } = useProfile();
  const { data: stats } = useDashboardStats();
  const { data: leaderboard } = useLeaderboard();
  const { data: friends = [] } = useFriends();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ 
    avatarUrl: profile?.avatarUrl ?? avatars[0], 
    title: profile?.title ?? titles[0] 
  });
  
  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const { data } = await api.get('/badges');
      return data as any[];
    }
  });

  const { data: recentSubmissions = [] } = useQuery({
    queryKey: ['recent-submissions'],
    queryFn: async () => {
      const { data } = await api.get('/submissions/me');
      return (data as any[]).slice(0, 10);
    }
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const { data } = await api.get('/challenges');
      return data as any[];
    }
  });

  useEffect(() => {
    if (profile) {
      setForm({ 
        avatarUrl: profile.avatarUrl ?? avatars[0], 
        title: profile.title ?? titles[0] 
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/users/profile', form);
      return data;
    },
    onSuccess: () => {
      refetch();
      setIsEditing(false);
      // Update auth store with new profile data
      const authState = authStore.getState();
      if (authState.user) {
        authStore.setState({
          user: {
            ...authState.user,
            avatarUrl: form.avatarUrl,
            title: form.title
          }
        });
      }
      alert('Profile updated successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to update profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile. Please try again.');
    }
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.avatarUrl || !form.title) {
      alert('Please select both an avatar and a title.');
      return;
    }
    mutation.mutate();
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        avatarUrl: profile.avatarUrl ?? avatars[0],
        title: profile.title ?? titles[0]
      });
    }
    setIsEditing(false);
  };

  const unlockedBadgeIds = profile?.badges?.map((b: any) => b.id) || [];
  const userRank = leaderboard?.findIndex((entry: any) => entry.user.id === profile?.id) + 1 || 0;
  const xpForNextLevel = (profile?.level || 1) * 100;
  const xpProgress = profile?.xp ? ((profile.xp % 100) / 100) * 100 : 0;

  // Calculate achievements
  const totalChallengesWon = challenges.filter((c: any) => 
    c.status === 'COMPLETED' && 
    ((c.challengerId === profile?.id && c.challengerScore > c.opponentScore) ||
     (c.opponentId === profile?.id && c.opponentScore > c.challengerScore))
  ).length;

  const winRate = challenges.length > 0 
    ? Math.round((totalChallengesWon / challenges.filter((c: any) => c.status === 'COMPLETED').length) * 100)
    : 0;

  // Weekly XP data for chart
  const weeklyXPData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    // Mock data - in real app, get from XPEvent
    return Math.floor(Math.random() * 100) + 50;
  });

  if (!profile) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-primary-500/20 via-purple-500/20 to-pink-500/20 p-8 md:p-12 shadow-2xl">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
            {/* Avatar */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full blur-2xl opacity-50 animate-pulse-slow"></div>
              <div className="relative w-32 h-32 rounded-full border-4 border-white/20 bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.firstName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{profile.firstName?.[0]}{profile.lastName?.[0]}</span>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-4 border-slate-900 flex items-center justify-center shadow-lg">
                <Crown className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  {profile.firstName} {profile.lastName}
                </h1>
                {profile.title && (
                  <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-semibold border border-white/30">
                    {profile.title}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-slate-200">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold">Level {profile.level || 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary-400" />
                  <span className="font-semibold">{profile.xp?.toLocaleString() || 0} XP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="font-semibold">{profile.streak || 0} day streak</span>
                </div>
                {userRank > 0 && (
                  <div className="flex items-center gap-2">
                    <Medal className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold">Rank #{userRank}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all flex items-center gap-2"
                title="Share Profile"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Profile link copied to clipboard!');
                }}
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-200">Progress to Level {profile.level ? profile.level + 1 : 2}</span>
              <span className="text-sm font-semibold text-white">{xpProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full h-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 transition-all duration-1000 shadow-lg"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-300">
              <span>{profile.xp ? profile.xp % 100 : 0} / 100 XP</span>
              <span>{100 - (profile.xp ? profile.xp % 100 : 0)} XP to next level</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Compact & Organized */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard
          icon={Trophy}
          title="Total XP"
          value={profile.xp?.toLocaleString() || '0'}
          subtitle={`Level ${profile.level || 1}`}
          color="success"
          trend="up"
          trendValue={`+${stats?.xpGainedToday || 0} today`}
        />
        <StatCard
          icon={Target}
          title="Problems Solved"
          value={stats?.problemsSolvedTotal || 0}
          subtitle={`${stats?.problemsSolvedToday || 0} today`}
          color="primary"
          trend="up"
        />
        <StatCard
          icon={Award}
          title="Badges"
          value={`${unlockedBadgeIds.length} / ${badges.length}`}
          subtitle="Unlocked"
          color="success"
        />
        <StatCard
          icon={Flame}
          title="Streak"
          value={`${profile.streak || 0} days`}
          subtitle={`Longest: ${stats?.longestStreak || 0} days`}
          color="warning"
        />
        <StatCard
          icon={Code}
          title="Typing Speed"
          value={`${stats?.averageTypingSpeed || 0} WPM`}
          subtitle="Average words per minute"
          color="info"
        />
        <StatCard
          icon={CheckCircle}
          title="Accuracy"
          value={`${stats?.accuracyRate || 0}%`}
          subtitle="Correct submissions"
          color="success"
        />
        <StatCard
          icon={Sword}
          title="Challenges"
          value={`${totalChallengesWon}W / ${challenges.filter((c: any) => c.status === 'COMPLETED').length}G`}
          subtitle={isNaN(winRate) ? 'No challenges' : `${winRate}% win rate`}
          color="warning"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Settings & Personalization */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Settings */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary-400" />
                Personalization
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-lg bg-primary-500/20 border border-primary-500/30 text-primary-400 hover:bg-primary-500/30 transition-colors flex items-center gap-2 text-sm font-semibold"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                  title="Cancel editing"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <form onSubmit={submit} className="space-y-6">
              <div>
                <p className="text-sm text-slate-400 mb-3">Choose avatar</p>
                <div className="flex gap-4">
                  {avatars.map((avatar) => (
                    <button
                      type="button"
                      key={avatar}
                      onClick={() => setForm({ ...form, avatarUrl: avatar })}
                      disabled={!isEditing}
                      className={`rounded-full border-4 transition-all ${
                        form.avatarUrl === avatar
                          ? 'border-primary-500 scale-110 shadow-lg shadow-primary-500/50'
                          : 'border-transparent hover:border-slate-600'
                      } ${!isEditing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <img src={avatar} alt="" className="h-16 w-16 rounded-full" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-3">Select title</p>
                <div className="flex flex-wrap gap-3">
                  {titles.map((title) => (
                    <button
                      type="button"
                      key={title}
                      onClick={() => setForm({ ...form, title })}
                      disabled={!isEditing}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        form.title === title
                          ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      } ${!isEditing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </div>
              {isEditing && (
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-3 font-semibold text-white hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {mutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </form>
          </div>

          {/* Friends */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-400" />
                Friends
              </h2>
              <button
                onClick={() => navigate('/friends')}
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                View All
              </button>
            </div>
            {friends.length > 0 ? (
              <div className="space-y-3">
                {friends.slice(0, 5).map((friend: any) => (
                  <div
                    key={friend.id}
                    onClick={() => navigate(`/chat?user=${friend.id}`)}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70 cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                      {friend.firstName?.[0]}{friend.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">
                        {friend.firstName} {friend.lastName}
                      </p>
                      <p className="text-xs text-slate-400">Level {friend.level || 1}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-primary-400">{friend.xp || 0} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No friends yet</p>
                <button
                  onClick={() => navigate('/friends')}
                  className="mt-3 text-primary-400 hover:text-primary-300 text-sm font-semibold"
                >
                  Add Friends
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Analytics & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Progress */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary-400" />
                Weekly Progress
              </h2>
              <span className="text-sm text-slate-400">Last 7 days</span>
            </div>
            <ProgressChart
              labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
              values={weeklyXPData}
            />
          </div>

          {/* Activity Graph */}
          <ActivityGraph weeks={52} />

          {/* Activity Streak & Recent Activity - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Streak Calendar */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary-400" />
                Activity Streak
              </h2>
              <StreakCalendar streak={profile.streak || 0} />
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 shadow-lg flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary-400" />
                  Recent Activity
                </h2>
                <button
                  onClick={() => navigate('/code-lab')}
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors font-semibold"
                >
                  View All
                </button>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[400px] pr-2">
                {recentSubmissions.length > 0 ? (
                  recentSubmissions.map((submission: any) => (
                    <div
                      key={submission.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70 transition-colors cursor-pointer"
                      onClick={() => {
                        if (submission.type === 'CODING') {
                          navigate('/code-lab');
                        } else {
                          navigate('/quiz-hub');
                        }
                      }}
                    >
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        submission.type === 'CODING' ? 'bg-purple-500/20' :
                        submission.type === 'QUIZ' ? 'bg-blue-500/20' :
                        'bg-slate-700/50'
                      }`}>
                        {submission.type === 'CODING' ? (
                          <Code className="h-4 w-4 text-purple-400" />
                        ) : (
                          <FileQuestion className="h-4 w-4 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {submission.type === 'CODING' ? 'Coding Exercise' : 'Quiz'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(submission.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-base font-bold ${
                          submission.score >= 70 ? 'text-success-400' :
                          submission.score >= 50 ? 'text-warning-400' :
                          'text-error-400'
                        }`}>
                          {submission.score}%
                        </p>
                        {submission.xpGain && (
                          <p className="text-xs text-primary-400">+{submission.xpGain} XP</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No recent activity</p>
                    <button
                      onClick={() => navigate('/code-lab')}
                      className="mt-4 px-4 py-2 rounded-lg bg-primary-500/20 border border-primary-500/30 text-primary-400 hover:bg-primary-500/30 transition-colors text-sm font-semibold"
                    >
                      Start Coding
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Collection */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary-400" />
              Badges Collection
            </h2>
            <p className="text-sm text-slate-400">
              {unlockedBadgeIds.length} of {badges.length} badges unlocked
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-success-500/20 border border-success-500/30">
              <span className="text-sm font-semibold text-success-400">
                {Math.round((unlockedBadgeIds.length / badges.length) * 100)}% Complete
              </span>
            </div>
          </div>
        </div>
        <BadgeGrid badges={badges} unlockedBadgeIds={unlockedBadgeIds} />
      </div>

      {/* Achievement Timeline */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary-400" />
          Achievement Timeline
        </h2>
        <div className="space-y-4">
          {unlockedBadgeIds.length > 0 ? (
            badges
              .filter((badge: any) => unlockedBadgeIds.includes(badge.id))
              .slice(0, 5)
              .map((badge: any, index: number) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700/50"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{badge.name}</p>
                    <p className="text-sm text-slate-400">{badge.description}</p>
                  </div>
                  <div className="text-right">
                    <Gift className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-400">Unlocked</p>
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No achievements yet. Keep learning!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
