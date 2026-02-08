import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { authStore, UserProfile } from '../store/auth.store';

export const useProfile = () =>
  useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get<any>('/users/profile');
      // Backend now returns role as string, just normalize to uppercase
      const normalizedRole = typeof data.role === 'string' ? data.role.toUpperCase() : data.role;
      const profile: UserProfile = {
        ...data,
        role: normalizedRole as 'STUDENT' | 'PROFESSOR' | 'ADMIN'
      };
      authStore.setState((state) => ({ ...state, user: profile }));
      return profile;
    }
  });

export const useDashboardStats = () =>
  useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/users/dashboard-stats');
      return data;
    }
  });

export const useNotifications = () =>
  useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/users/notifications');
      return data;
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

export const useAdminDashboard = () =>
  useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/admin/dashboard');
      return data;
    }
  });

export const useLessons = () =>
  useQuery({
    queryKey: ['lessons'],
    queryFn: async () => {
      const { data } = await api.get('/lessons');
      return data as any[];
    }
  });

export const useQuizzes = () =>
  useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const { data } = await api.get('/quizzes');
      return data as any[];
    }
  });

export const useCosmetics = () =>
  useQuery({
    queryKey: ['cosmetics'],
    queryFn: async () => {
      const { data } = await api.get('/cosmetics');
      return data as any[];
    }
  });

export const useMyCosmetics = () =>
  useQuery({
    queryKey: ['cosmetics', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/cosmetics/me');
      return data as any;
    }
  });

export const useLeaderboard = () =>
  useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data } = await api.get('/leaderboard');
      return data as any[];
    }
  });

export const useLeaderboardPeriod = () =>
  useQuery({
    queryKey: ['leaderboard', 'period'],
    queryFn: async () => {
      const { data } = await api.get('/leaderboard/period');
      return data;
    }
  });

// -------------------------------
// Professor Analytics (scoped to professor's classes)
// -------------------------------

export const useProfessorClassSummary = (classId: number | null, fromISO: string, toISO: string) =>
  useQuery({
    queryKey: ['professor-analytics', 'class', classId, 'summary', fromISO, toISO],
    enabled: Boolean(classId),
    queryFn: async () => {
      const { data } = await api.get(`/professor/analytics/classes/${classId}/summary`, {
        params: { from: fromISO, to: toISO }
      });
      return data as any;
    }
  });

export const useProfessorClassLeaderboard = (
  classId: number | null,
  metric: 'xpGain' | 'xpTotal' | 'solved',
  fromISO: string,
  toISO: string
) =>
  useQuery({
    queryKey: ['professor-analytics', 'class', classId, 'leaderboard', metric, fromISO, toISO],
    enabled: Boolean(classId),
    queryFn: async () => {
      const { data } = await api.get(`/professor/analytics/classes/${classId}/leaderboard`, {
        params: { metric, from: fromISO, to: toISO, limit: 25 }
      });
      return data as any;
    }
  });

export const useProfessorClassTimeseries = (
  classId: number | null,
  metric: 'submissions' | 'activeStudents' | 'xpGain',
  fromISO: string,
  toISO: string
) =>
  useQuery({
    queryKey: ['professor-analytics', 'class', classId, 'timeseries', metric, fromISO, toISO],
    enabled: Boolean(classId),
    queryFn: async () => {
      const { data } = await api.get(`/professor/analytics/classes/${classId}/timeseries`, {
        params: { metric, from: fromISO, to: toISO }
      });
      return data as any;
    }
  });

export const useProfessorClassStudents = (classId: number | null, fromISO: string, toISO: string) =>
  useQuery({
    queryKey: ['professor-analytics', 'class', classId, 'students', fromISO, toISO],
    enabled: Boolean(classId),
    queryFn: async () => {
      const { data } = await api.get(`/professor/analytics/classes/${classId}/students`, {
        params: { from: fromISO, to: toISO }
      });
      return data as any;
    }
  });

export const useProfessorClassRisks = (classId: number | null, fromISO: string, toISO: string) =>
  useQuery({
    queryKey: ['professor-analytics', 'class', classId, 'risks', fromISO, toISO],
    enabled: Boolean(classId),
    queryFn: async () => {
      const { data } = await api.get(`/professor/analytics/classes/${classId}/risks`, {
        params: { from: fromISO, to: toISO }
      });
      return data as any;
    }
  });

export const useProfessorClassModules = (classId: number | null, fromISO: string, toISO: string) =>
  useQuery({
    queryKey: ['professor-analytics', 'class', classId, 'modules', fromISO, toISO],
    enabled: Boolean(classId),
    queryFn: async () => {
      const { data } = await api.get(`/professor/analytics/classes/${classId}/modules`, {
        params: { from: fromISO, to: toISO }
      });
      return data as any;
    }
  });

export const useMissions = () =>
  useQuery({
    queryKey: ['missions'],
    queryFn: async () => {
      const { data } = await api.get('/missions');
      return data as any[];
    }
  });

export const useLogin = () =>
  useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const { data } = await api.post('/auth/login', payload);
      const profileResponse = await api.get<any>('/users/profile', {
        headers: { Authorization: `Bearer ${data.accessToken}` }
      });
      // Backend now returns role as string, just normalize to uppercase
      const roleString = profileResponse.data.role || profileResponse.data?.data?.role;
      const normalizedRole = typeof roleString === 'string' ? roleString.toUpperCase() : roleString;
      const profile: UserProfile = {
        ...(profileResponse.data || profileResponse.data?.data || profileResponse),
        role: normalizedRole as 'STUDENT' | 'PROFESSOR' | 'ADMIN'
      };
      console.log('Login - profile response:', profileResponse, 'profile:', profile, 'role:', normalizedRole);
      authStore
        .getState()
        .setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: profile });
      return profile;
    }
  });

export const useRegister = () =>
  useMutation({
    mutationFn: async (payload: { email: string; password: string; firstName: string; lastName: string }) => {
      const { data } = await api.post('/auth/register', payload);
      const profileResponse = await api.get<any>('/users/profile', {
        headers: { Authorization: `Bearer ${data.accessToken}` }
      });
      // Backend now returns role as string, just normalize to uppercase
      const roleString = profileResponse.data.role || profileResponse.data?.data?.role;
      const normalizedRole = typeof roleString === 'string' ? roleString.toUpperCase() : roleString;
      const profile: UserProfile = {
        ...(profileResponse.data || profileResponse.data?.data || profileResponse),
        role: normalizedRole as 'STUDENT' | 'PROFESSOR' | 'ADMIN'
      };
      authStore
        .getState()
        .setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: profile });
      return profile;
    }
  });

export const useForgotPassword = () =>
  useMutation({
    mutationFn: async (payload: { email: string }) => {
      const { data } = await api.post('/auth/forgot-password', payload);
      return data;
    }
  });

export const useResetPassword = () =>
  useMutation({
    mutationFn: async (payload: { token: string; newPassword: string }) => {
      const { data } = await api.post('/auth/reset-password', payload);
      return data;
    }
  });

export const useFriends = () =>
  useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const { data } = await api.get('/friends');
      return data as any[];
    }
  });

export const useAddFriend = () =>
  useMutation({
    mutationFn: async (friendId: number) => {
      const { data } = await api.post(`/friends/${friendId}`);
      return data;
    }
  });

// Admin Messaging Hooks
export const useMessages = () =>
  useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const { data } = await api.get('/admin/messages');
      return data as any[];
    }
  });

export const useSendMessage = () =>
  useMutation({
    mutationFn: async (payload: { receiverId: number; subject: string; content: string }) => {
      const { data } = await api.post('/admin/messages', payload);
      return data;
    }
  });

export const useUnreadCount = () =>
  useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const { data } = await api.get('/admin/messages/unread/count');
      return data;
    }
  });

// Admin Approval Hooks
export const usePendingApprovals = () =>
  useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const { data } = await api.get('/admin/approvals/pending');
      return data as any[];
    }
  });

export const useReviewApproval = () =>
  useMutation({
    mutationFn: async (payload: { id: number; status: 'APPROVED' | 'REJECTED' | 'REVISIONS_REQUESTED'; adminNotes?: string }) => {
      const { data } = await api.post(`/admin/approvals/${payload.id}/review`, {
        status: payload.status,
        adminNotes: payload.adminNotes
      });
      return data;
    }
  });

export const useMySubmissions = () =>
  useQuery({
    queryKey: ['my-submissions'],
    queryFn: async () => {
      const { data } = await api.get('/admin/approvals/my-submissions');
      return data as any[];
    }
  });

export const useSubmitForApproval = () =>
  useMutation({
    mutationFn: async (payload: { contentType: 'LESSON' | 'QUIZ' | 'CODING_EXERCISE'; contentId: number }) => {
      const { data } = await api.post('/admin/approvals/submit', payload);
      return data;
    }
  });

// Support Ticket Hooks
export const useSupportTickets = () =>
  useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const { data } = await api.get('/support/tickets');
      return data as any[];
    }
  });

export const useCreateTicket = () =>
  useMutation({
    mutationFn: async (payload: { subject: string; description: string; category: string; priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' }) => {
      const { data } = await api.post('/support/tickets', payload);
      return data;
    }
  });

export const useAddTicketReply = () =>
  useMutation({
    mutationFn: async (payload: { ticketId: number; content: string; isInternal?: boolean }) => {
      const { data } = await api.post(`/support/tickets/${payload.ticketId}/replies`, {
        content: payload.content,
        isInternal: payload.isInternal
      });
      return data;
    }
  });

export const useAssignTicket = () =>
  useMutation({
    mutationFn: async (ticketId: number) => {
      const { data } = await api.post(`/support/tickets/${ticketId}/assign`);
      return data;
    }
  });

export const useResolveTicket = () =>
  useMutation({
    mutationFn: async (payload: { ticketId: number; resolution: string }) => {
      const { data } = await api.post(`/support/tickets/${payload.ticketId}/resolve`, {
        resolution: payload.resolution
      });
      return data;
    }
  });

// Classes Hooks
export const useCreateClass = () =>
  useMutation({
    mutationFn: async (payload: { name: string; description?: string; usesRoadmap?: boolean }) => {
      const { data } = await api.post('/classes', payload);
      return data;
    }
  });

export const useMyClasses = () =>
  useQuery({
    queryKey: ['my-classes'],
    queryFn: async () => {
      const { data } = await api.get('/classes/my-classes');
      return data as any[];
    }
  });

export const useClass = (classId: number | null) =>
  useQuery({
    queryKey: ['class', classId],
    queryFn: async () => {
      if (!classId) return null;
      const { data } = await api.get(`/classes/${classId}`);
      return data;
    },
    enabled: !!classId
  });

export const useJoinClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invitationCode: string) => {
      const { data } = await api.post('/classes/join', { invitationCode });
      return data;
    },
    onSuccess: () => {
      // Invalidează cache-ul pentru clasele la care studentul este înscris
      queryClient.invalidateQueries({ queryKey: ['my-joined-classes'] });
    }
  });
};

export const useMyJoinedClasses = () =>
  useQuery({
    queryKey: ['my-joined-classes'],
    queryFn: async () => {
      const { data } = await api.get('/classes/my-joined-classes');
      return data as any[];
    }
  });

export const useRegenerateInvitationCode = () =>
  useMutation({
    mutationFn: async (classId: number) => {
      const { data } = await api.post(`/classes/${classId}/regenerate-code`);
      return data;
    }
  });

// Announcements Hooks
export const useCreateAnnouncement = () =>
  useMutation({
    mutationFn: async (payload: { classId: number; title: string; content: string }) => {
      const { data } = await api.post(`/classes/${payload.classId}/announcements`, {
        title: payload.title,
        content: payload.content
      });
      return data;
    }
  });

export const useClassAnnouncements = (classId: number | null) =>
  useQuery({
    queryKey: ['announcements', classId],
    queryFn: async () => {
      if (!classId) return [];
      const { data } = await api.get(`/classes/${classId}/announcements`);
      return data as any[];
    },
    enabled: !!classId
  });

// Assignments Hooks
export const useCreateAssignment = () =>
  useMutation({
    mutationFn: async (payload: {
      classId: number;
      title: string;
      description: string;
      type: 'PROBLEM' | 'HOMEWORK' | 'MATERIAL';
      difficulty: string;
      contentId?: number;
      contentType?: 'LESSON' | 'QUIZ' | 'CODING_EXERCISE';
      dueDate?: string;
    }) => {
      const { data } = await api.post(`/classes/${payload.classId}/assignments`, payload);
      return data;
    }
  });

export const useClassAssignments = (classId: number | null) =>
  useQuery({
    queryKey: ['assignments', classId],
    queryFn: async () => {
      if (!classId) return [];
      const { data } = await api.get(`/classes/${classId}/assignments`);
      return data as any[];
    },
    enabled: !!classId
  });

export const useAssignment = (classId: number | null, assignmentId: number | null) =>
  useQuery({
    queryKey: ['assignment', classId, assignmentId],
    queryFn: async () => {
      if (!classId || !assignmentId) return null;
      const { data } = await api.get(`/classes/${classId}/assignments/${assignmentId}`);
      return data;
    },
    enabled: !!classId && !!assignmentId
  });

export const useSubmitAssignment = () =>
  useMutation({
    mutationFn: async (payload: { classId: number; assignmentId: number; submissionId: number }) => {
      const { data } = await api.post(`/classes/${payload.classId}/assignments/${payload.assignmentId}/submit`, {
        submissionId: payload.submissionId
      });
      return data;
    }
  });

// Admin Assignment Approval Hooks
export const usePendingAssignments = () =>
  useQuery({
    queryKey: ['pending-assignments'],
    queryFn: async () => {
      const { data } = await api.get('/admin/assignments/pending');
      return data as any[];
    }
  });

export const useReviewAssignment = () =>
  useMutation({
    mutationFn: async (payload: { id: number; status: 'APPROVED' | 'REJECTED'; adminNotes?: string }) => {
      const { data } = await api.post(`/admin/assignments/${payload.id}/review`, {
        status: payload.status,
        adminNotes: payload.adminNotes
      });
      return data;
    }
  });

export const useConversations = () =>
  useQuery({
    queryKey: ['chat-conversations'],
    queryFn: async () => {
      const { data } = await api.get('/chat/conversations');
      return data as any[];
    }
  });

export const useConversation = (conversationId: number, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['chat-conversation', conversationId],
    queryFn: async () => {
      const { data } = await api.get(`/chat/conversations/${conversationId}`);
      return data;
    },
    enabled: options?.enabled !== false && conversationId > 0,
    refetchInterval: 2000 // Poll every 2 seconds
  });

export const useSendChatMessage = () =>
  useMutation({
    mutationFn: async (payload: { conversationId: number; content: string }) => {
      const { data } = await api.post(`/chat/conversations/${payload.conversationId}/messages`, {
        content: payload.content
      });
      return data;
    }
  });

export const useCreateDirectConversation = () =>
  useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await api.post(`/chat/conversations/direct/${userId}`);
      return data;
    }
  });

export const useCreateSupportConversation = () =>
  useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/chat/conversations/support');
      return data;
    }
  });



