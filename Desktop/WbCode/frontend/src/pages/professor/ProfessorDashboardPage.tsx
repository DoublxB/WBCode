import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import StatCard from '../../components/StatCard';

const ProfessorDashboardPage = () => {
  const { data } = useQuery({
    queryKey: ['professor-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/professor/dashboard');
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-400">Monitor your cohort</p>
        <h1 className="text-3xl font-semibold text-white">Professor Dashboard</h1>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Students" value={data?.totalStudents ?? 0} />
        <StatCard title="Submissions" value={data?.totalSubmissions ?? 0} />
        <StatCard title="Average XP" value={Math.round(data?.avgXP ?? 0)} />
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="text-xl font-semibold text-white">Top Learners</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="px-3 py-2">Rank</th>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">XP</th>
            </tr>
          </thead>
          <tbody>
            {data?.topLearners?.map((entry: any) => (
              <tr key={entry.id} className="border-t border-slate-800">
                <td className="px-3 py-2">#{entry.rank}</td>
                <td className="px-3 py-2">{entry.user.firstName}</td>
                <td className="px-3 py-2 text-primary font-semibold">{entry.xp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfessorDashboardPage;












