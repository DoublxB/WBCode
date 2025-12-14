import { createBrowserRouter, redirect } from 'react-router-dom';
import AppLayout from './templates/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import StudentDashboard from './pages/student/StudentDashboard';
import CodeLabPage from './pages/student/CodeLabPage';
import QuizHubPage from './pages/student/QuizHubPage';
import ProfilePage from './pages/student/ProfilePage';
import LeaderboardPage from './pages/student/LeaderboardPage';
import MissionsPage from './pages/student/MissionsPage';
import ChallengesPage from './pages/student/ChallengesPage';
import ChallengeSolvePage from './pages/student/ChallengeSolvePage';
import FriendsPage from './pages/student/FriendsPage';
import ProfessorDashboardPage from './pages/professor/ProfessorDashboardPage';
import ContentBuilderPage from './pages/professor/ContentBuilderPage';
import ReportsPage from './pages/professor/ReportsPage';
import AdminPanelPage from './pages/admin/AdminPanelPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminMessagingPage from './pages/admin/AdminMessagingPage';
import AdminApprovalsPage from './pages/admin/AdminApprovalsPage';
import AdminSupportPage from './pages/admin/AdminSupportPage';
import AssignmentApprovalsPage from './pages/admin/AssignmentApprovalsPage';
import ClassesPage from './pages/professor/ClassesPage';
import StudentClassesPage from './pages/student/StudentClassesPage';
import ClassDetailPage from './pages/student/ClassDetailPage';
import AssignmentDetailPage from './pages/student/AssignmentDetailPage';
import CreateAssignmentPage from './pages/professor/CreateAssignmentPage';
import ChatPage from './pages/chat/ChatPage';
import { authStore } from './store/auth.store';

const loader = () => {
  // Force fresh read from localStorage to avoid stale data
  const persisted = typeof window !== 'undefined' ? localStorage.getItem('wbcode_auth') : undefined;
  let state = authStore.getState();
  
  // If we have persisted data but store is empty, reload from localStorage
  if (persisted && !state.user) {
    try {
      const parsed = JSON.parse(persisted);
      if (parsed.user) {
        const normalizedRole = typeof parsed.user.role === 'string' ? parsed.user.role.toUpperCase() : parsed.user.role;
        state = {
          ...state,
          user: { ...parsed.user, role: normalizedRole },
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken,
          isAuthenticated: Boolean(parsed.accessToken)
        };
      }
    } catch (e) {
      // Invalid localStorage data, clear it
      localStorage.removeItem('wbcode_auth');
    }
  }
  
  if (!state.isAuthenticated) {
    throw redirect('/auth/login');
  }
  return null;
};

const indexLoader = () => {
  // Force fresh read from localStorage to avoid stale data
  const persisted = typeof window !== 'undefined' ? localStorage.getItem('wbcode_auth') : undefined;
  let state = authStore.getState();
  
  // If we have persisted data but store is empty, reload from localStorage
  if (persisted && !state.user) {
    try {
      const parsed = JSON.parse(persisted);
      if (parsed.user) {
        const normalizedRole = typeof parsed.user.role === 'string' ? parsed.user.role.toUpperCase() : parsed.user.role;
        state = {
          ...state,
          user: { ...parsed.user, role: normalizedRole },
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken,
          isAuthenticated: Boolean(parsed.accessToken)
        };
      }
    } catch (e) {
      // Invalid localStorage data, clear it
      localStorage.removeItem('wbcode_auth');
    }
  }
  
  if (!state.isAuthenticated || !state.user) {
    throw redirect('/auth/login');
  }
  
  // Backend now returns role as string, just normalize to uppercase
  const role = typeof state.user?.role === 'string' ? state.user.role.toUpperCase() : state.user?.role;
  console.log('Router indexLoader - user:', state.user, 'role:', role);
  
  if (role === 'ADMIN') {
    throw redirect('/admin');
  } else if (role === 'PROFESSOR') {
    throw redirect('/professor');
  }
  // STUDENT stays on index (StudentDashboard)
  return null;
};

export const router = createBrowserRouter([
  {
    path: '/',
    loader,
    element: <AppLayout />,
    children: [
      { index: true, loader: indexLoader, element: <StudentDashboard /> },
      { path: 'code-lab', element: <CodeLabPage /> },
      { path: 'quizzes', element: <QuizHubPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'leaderboard', element: <LeaderboardPage /> },
      { path: 'missions', element: <MissionsPage /> },
      { path: 'challenges', element: <ChallengesPage /> },
      { path: 'challenges/:id/solve', element: <ChallengeSolvePage /> },
      { path: 'friends', element: <FriendsPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'professor', element: <ProfessorDashboardPage /> },
      { path: 'professor/content', element: <ContentBuilderPage /> },
      { path: 'professor/reports', element: <ReportsPage /> },
      { path: 'professor/classes', element: <ClassesPage /> },
      { path: 'professor/classes/:id', element: <ClassDetailPage /> },
      { path: 'professor/classes/:classId/create-assignment', element: <CreateAssignmentPage /> },
      { path: 'classes', element: <StudentClassesPage /> },
      { path: 'classes/:id', element: <ClassDetailPage /> },
      { path: 'classes/:classId/assignments/:assignmentId', element: <AssignmentDetailPage /> },
      { path: 'admin', element: <AdminDashboardPage /> },
      { path: 'admin/users', element: <AdminPanelPage /> },
      { path: 'admin/messages', element: <AdminMessagingPage /> },
      { path: 'admin/approvals', element: <AdminApprovalsPage /> },
      { path: 'admin/assignment-approvals', element: <AssignmentApprovalsPage /> },
      { path: 'admin/support', element: <AdminSupportPage /> }
    ]
  },
  {
    path: '/auth/login',
    element: <LoginPage />
  },
  {
    path: '/auth/register',
    element: <RegisterPage />
  },
  {
    path: '/auth/forgot-password',
    element: <ForgotPasswordPage />
  },
  {
    path: '/auth/reset-password',
    element: <ResetPasswordPage />
  }
]);



