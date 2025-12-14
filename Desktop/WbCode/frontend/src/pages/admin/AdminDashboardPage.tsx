import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAdminDashboard } from '../../api/hooks';
import { Role } from '../../store/auth.store';
import StatCard from '../../components/StatCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import {
  Users,
  UserPlus,
  Activity,
  BookOpen,
  FileQuestion,
  Code,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Award,
  MessageSquare,
  LifeBuoy,
  GraduationCap,
  Sword,
  Target,
  Shield,
  Clock,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { useState } from 'react';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  const { data: stats, isLoading: statsLoading } = useAdminDashboard();

  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users', roleFilter],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      return data as any[];
    }
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) => 
      api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      refetchUsers();
      setSelectedUser(null);
    }
  });

  const filteredUsers = users?.filter((user: any) => {
    const matchesSearch = !searchQuery || 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || 
      (typeof user.role === 'string' ? user.role : user.role?.name) === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" count={8} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-red-500/10 via-purple-500/10 to-indigo-500/10 p-6 md:p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-purple-600 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Admin Control Center</p>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Dashboard Overview</h1>
            </div>
          </div>
          <p className="text-slate-300 mt-2">
            Monitor and manage the entire platform from one central location
          </p>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          subtitle={`${stats?.students ?? 0} students, ${stats?.professors ?? 0} professors`}
          color="primary"
          trend="up"
          trendValue={`+${stats?.newUsersToday ?? 0} today`}
        />
        <StatCard
          icon={Activity}
          label="Active Today"
          value={stats?.activeUsersToday ?? 0}
          subtitle={`${stats?.activeUsersThisWeek ?? 0} this week`}
          color="success"
        />
        <StatCard
          icon={CheckCircle}
          label="Pending Approvals"
          value={(stats?.pendingApprovals ?? 0) + (stats?.pendingAssignmentApprovals ?? 0)}
          subtitle="Content & Assignments"
          color="warning"
        />
        <StatCard
          icon={LifeBuoy}
          label="Open Tickets"
          value={stats?.openTickets ?? 0}
          subtitle={`${stats?.urgentTickets ?? 0} urgent`}
          color="error"
        />
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Statistics */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary-500/20">
              <Users className="h-5 w-5 text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">User Statistics</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Students</span>
              <span className="text-lg font-bold text-white">{stats?.students ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Professors</span>
              <span className="text-lg font-bold text-white">{stats?.professors ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Admins</span>
              <span className="text-lg font-bold text-white">{stats?.admins ?? 0}</span>
            </div>
            <div className="pt-4 border-t border-slate-700/50">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">New This Week</span>
                <span className="text-lg font-bold text-success-400">+{stats?.newUsersThisWeek ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Statistics */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <BookOpen className="h-5 w-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Content Statistics</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-slate-400" />
                <span className="text-slate-400">Lessons</span>
              </div>
              <span className="text-lg font-bold text-white">
                {stats?.publishedLessons ?? 0} / {stats?.totalLessons ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileQuestion className="h-4 w-4 text-slate-400" />
                <span className="text-slate-400">Quizzes</span>
              </div>
              <span className="text-lg font-bold text-white">
                {stats?.publishedQuizzes ?? 0} / {stats?.totalQuizzes ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-slate-400" />
                <span className="text-slate-400">Exercises</span>
              </div>
              <span className="text-lg font-bold text-white">
                {stats?.publishedCodingExercises ?? 0} / {stats?.totalCodingExercises ?? 0}
              </span>
            </div>
            <div className="pt-4 border-t border-slate-700/50">
              <button
                onClick={() => navigate('/admin/approvals')}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-warning-500/20 border border-warning-500/30 px-4 py-2 text-warning-400 hover:bg-warning-500/30 transition-colors text-sm font-semibold"
              >
                <AlertCircle className="h-4 w-4" />
                {stats?.pendingApprovals ?? 0} Pending Approvals
              </button>
            </div>
          </div>
        </div>

        {/* Activity Statistics */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-success-500/20">
              <TrendingUp className="h-5 w-5 text-success-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Activity Statistics</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Submissions</span>
              <span className="text-lg font-bold text-white">{stats?.totalSubmissions?.toLocaleString() ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Today</span>
              <span className="text-lg font-bold text-success-400">{stats?.submissionsToday ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">This Week</span>
              <span className="text-lg font-bold text-success-400">{stats?.submissionsThisWeek ?? 0}</span>
            </div>
            <div className="pt-4 border-t border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Average Score</span>
                <span className="text-lg font-bold text-white">{stats?.averageScore ?? 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total XP</span>
                <span className="text-lg font-bold text-primary-400">{stats?.totalXP?.toLocaleString() ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={GraduationCap}
          label="Classes"
          value={`${stats?.activeClasses ?? 0} / ${stats?.totalClasses ?? 0}`}
          subtitle="Active classes"
          color="info"
        />
        <StatCard
          icon={Sword}
          label="Challenges"
          value={`${stats?.activeChallenges ?? 0} / ${stats?.totalChallenges ?? 0}`}
          subtitle="Active challenges"
          color="warning"
        />
        <StatCard
          icon={Target}
          label="Missions"
          value={`${stats?.activeMissions ?? 0} / ${stats?.totalMissions ?? 0}`}
          subtitle="Active missions"
          color="success"
        />
        <StatCard
          icon={LifeBuoy}
          label="Support"
          value={`${stats?.openTickets ?? 0} open`}
          subtitle={`${stats?.inProgressTickets ?? 0} in progress`}
          color="error"
        />
      </div>

      {/* User Management */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-500/20">
                <Users className="h-5 w-5 text-primary-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">User Management</h2>
            </div>
            <button
              onClick={() => navigate('/admin/users')}
              className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
            >
              View All
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-10 pr-8 py-2 rounded-lg bg-slate-900/50 border border-slate-700/50 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="all">All Roles</option>
                <option value="STUDENT">Students</option>
                <option value="PROFESSOR">Professors</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">XP</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.slice(0, 10).map((user: any) => {
                  const userRole = typeof user.role === 'string' ? user.role : user.role?.name || 'STUDENT';
                  const isSelected = selectedUser === user.id;
                  
                  return (
                    <tr
                      key={user.id}
                      className={`border-t border-slate-700/50 hover:bg-slate-800/30 transition-colors ${
                        isSelected ? 'bg-slate-800/50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-slate-400">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-300">{user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={userRole}
                          onChange={(e) => {
                            setSelectedUser(user.id);
                            updateRole.mutate({ id: user.id, role: e.target.value as Role });
                          }}
                          disabled={updateRole.isPending}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                            userRole === 'ADMIN' ? 'bg-red-500/20 border-red-500/30 text-red-300' :
                            userRole === 'PROFESSOR' ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' :
                            'bg-slate-700/50 border-slate-600/50 text-slate-300'
                          } focus:outline-none focus:ring-2 focus:ring-primary-500/50`}
                        >
                          <option value="STUDENT">Student</option>
                          <option value="PROFESSOR">Professor</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-primary-400 font-semibold">{user.xp?.toLocaleString() ?? 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400 text-xs">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/profile?user=${user.id}`)}
                            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                            title="View Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-success-500/20">
              <UserPlus className="h-5 w-5 text-success-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Recent Users</h2>
          </div>
          <div className="space-y-3">
            {stats?.recentUsers?.map((user: any) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'ADMIN' ? 'bg-red-500/20 text-red-300' :
                    user.role === 'PROFESSOR' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-slate-700/50 text-slate-300'
                  }`}>
                    {user.role}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary-500/20">
              <Activity className="h-5 w-5 text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {stats?.recentSubmissions?.map((submission: any) => (
              <div
                key={submission.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
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
                  <div>
                    <p className="text-sm font-semibold text-white">{submission.userName}</p>
                    <p className="text-xs text-slate-400">{submission.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${
                    submission.score >= 70 ? 'text-success-400' :
                    submission.score >= 50 ? 'text-warning-400' :
                    'text-error-400'
                  }`}>
                    {submission.score}%
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

