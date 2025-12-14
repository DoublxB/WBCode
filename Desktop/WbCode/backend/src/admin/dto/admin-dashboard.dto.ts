export interface AdminDashboardDto {
  // User Statistics
  totalUsers: number;
  students: number;
  professors: number;
  admins: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;

  // Content Statistics
  totalLessons: number;
  publishedLessons: number;
  totalQuizzes: number;
  publishedQuizzes: number;
  totalCodingExercises: number;
  publishedCodingExercises: number;
  pendingApprovals: number;
  pendingAssignmentApprovals: number;

  // Activity Statistics
  totalSubmissions: number;
  submissionsToday: number;
  submissionsThisWeek: number;
  averageScore: number;
  totalXP: number;
  averageXP: number;

  // Support Statistics
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  urgentTickets: number;

  // System Statistics
  totalClasses: number;
  activeClasses: number;
  totalChallenges: number;
  activeChallenges: number;
  totalMissions: number;
  activeMissions: number;

  // Recent Activity
  recentUsers: Array<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
  recentSubmissions: Array<{
    id: number;
    userId: number;
    userName: string;
    type: string;
    score: number;
    createdAt: string;
  }>;
}

