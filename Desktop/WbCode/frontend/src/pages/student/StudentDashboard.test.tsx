import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StudentDashboard from './StudentDashboard';
import * as hooks from '../../api/hooks';

jest.mock('../../api/hooks');

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('StudentDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dashboard with user data', () => {
    (hooks.useProfile as jest.Mock).mockReturnValue({
      data: {
        id: 1,
        firstName: 'John',
        xp: 150,
        level: 2,
        streak: 5
      }
    });

    (hooks.useLeaderboard as jest.Mock).mockReturnValue({
      data: [{ id: 1, rank: 1, user: { firstName: 'John' }, xp: 150 }]
    });

    (hooks.useLessons as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          title: 'Test Lesson',
          description: 'Test Description',
          difficulty: 'BEGINNER'
        }
      ]
    });

    render(<StudentDashboard />, { wrapper });

    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/John, ready to push your streak/i)).toBeInTheDocument();
    expect(screen.getByText(/150/)).toBeInTheDocument();
    expect(screen.getByText(/Level/)).toBeInTheDocument();
  });

  it('should display lessons', () => {
    (hooks.useProfile as jest.Mock).mockReturnValue({ data: { firstName: 'John', xp: 0, level: 1, streak: 0 } });
    (hooks.useLeaderboard as jest.Mock).mockReturnValue({ data: [] });
    (hooks.useLessons as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          title: 'Test Lesson',
          description: 'Test Description',
          difficulty: 'BEGINNER'
        }
      ]
    });

    render(<StudentDashboard />, { wrapper });

    expect(screen.getByText('Test Lesson')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    (hooks.useProfile as jest.Mock).mockReturnValue({ data: undefined });
    (hooks.useLeaderboard as jest.Mock).mockReturnValue({ data: undefined });
    (hooks.useLessons as jest.Mock).mockReturnValue({ data: undefined });

    render(<StudentDashboard />, { wrapper });

    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });
});

