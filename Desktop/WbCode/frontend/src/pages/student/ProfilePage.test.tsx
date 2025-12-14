import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfilePage from './ProfilePage';
import * as hooks from '../../api/hooks';
import { api } from '../../api/client';

jest.mock('../../api/hooks');
jest.mock('../../api/client');

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (hooks.useProfile as jest.Mock).mockReturnValue({
      data: {
        id: 1,
        firstName: 'John',
        avatarUrl: 'https://placekitten.com/200/200',
        title: 'Novice Coder'
      },
      refetch: jest.fn()
    });
    (api.patch as jest.Mock).mockResolvedValue({ data: {} });
  });

  it('should render profile page', () => {
    render(<ProfilePage />, { wrapper });

    expect(screen.getByText('Profile & Avatar')).toBeInTheDocument();
    expect(screen.getByText('Choose avatar')).toBeInTheDocument();
    expect(screen.getByText('Select title')).toBeInTheDocument();
  });

  it('should allow selecting avatar', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { wrapper });

    const avatars = screen.getAllByRole('img');
    expect(avatars.length).toBeGreaterThan(0);

    // Click second avatar
    const secondAvatar = avatars[1];
    await user.click(secondAvatar);

    // Avatar should be selected (border-primary class)
    expect(secondAvatar.closest('button')).toHaveClass('border-primary');
  });

  it('should allow selecting title', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { wrapper });

    const titleButton = screen.getByText('Algorithm Explorer');
    await user.click(titleButton);

    expect(titleButton).toHaveClass('bg-primary');
  });

  it('should save changes on submit', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { wrapper });

    const saveButton = screen.getByText('Save changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/users/profile', expect.any(Object));
    });
  });
});










