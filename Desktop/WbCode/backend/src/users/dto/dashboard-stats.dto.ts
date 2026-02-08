export interface DashboardStatsDto {
  // XP & Level
  totalXP: number;
  level: number;
  xpGainedToday: number;
  xpGainedThisWeek: number;
  
  // Activity
  problemsSolvedToday: number;
  problemsSolvedThisWeek: number;
  problemsSolvedTotal: number;
  uniqueProblemsSolved?: number;
  firstTryCount?: number;
  lessonsReadCount?: number;
  quizzesCompletedToday: number;
  quizzesCompletedThisWeek: number;
  
  // Performance
  averageTypingSpeed: number; // WPM (words per minute) - calculated from submissions
  averageScore: number;
  accuracyRate: number; // percentage of correct submissions
  
  // Challenges
  challengesWon: number;
  challengesLost: number;
  challengesTotal: number;
  challengeWinRate?: number;
  
  // Streak & Activity
  currentStreak: number;
  longestStreak: number;
  activeDaysThisWeek: number;
  
  // Time spent
  timeSpentToday: number; // minutes
  timeSpentThisWeek: number; // minutes
  
  // Badges
  badgesEarned: number;
  badgesTotal: number;
  
  // Leaderboard
  leaderboardRank: number;
  leaderboardTotal: number;
}

