import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Role } from '../../store/auth.store';

const AdminPanelPage = () => {
  const { data, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      return data as any[];
    }
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => refetch()
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-400">Manage permissions</p>
        <h1 className="text-3xl font-semibold text-white">Admin Control Center</h1>
      </header>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((user) => (
              <tr key={user.id} className="border-t border-slate-800">
                <td className="px-4 py-3 text-white">{user.firstName}</td>
                <td className="px-4 py-3 text-slate-300">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase">
                    {typeof user.role === 'string' ? user.role : user.role?.name || 'UNKNOWN'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={typeof user.role === 'string' ? user.role : user.role?.name || 'STUDENT'}
                    onChange={(e) => updateRole.mutate({ id: user.id, role: e.target.value as Role })}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-white"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="PROFESSOR">Professor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanelPage;



