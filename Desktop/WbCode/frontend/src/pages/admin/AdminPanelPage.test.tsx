import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminPanelPage from './AdminPanelPage';
import { api } from '../../api/client';

jest.mock('../../api/client');

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('AdminPanelPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 1,
          firstName: 'John',
          email: 'john@example.com',
          role: { name: 'STUDENT' }
        },
        {
          id: 2,
          firstName: 'Jane',
          email: 'jane@example.com',
          role: { name: 'PROFESSOR' }
        }
      ]
    });
    (api.patch as jest.Mock).mockResolvedValue({ data: {} });
  });

  it('should render admin panel with users', async () => {
    render(<AdminPanelPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Admin Control Center')).toBeInTheDocument();
    });

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  it('should allow changing user role', async () => {
    const user = userEvent.setup();
    render(<AdminPanelPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    const select = screen.getAllByRole('combobox')[0];
    await user.selectOptions(select, 'PROFESSOR');

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/admin/users/1/role', { role: 'PROFESSOR' });
    });
  });
});

















