import { useMutation } from '@tanstack/react-query';
import { api } from '../../api/client';

const ReportsPage = () => {
  const exportReport = useMutation({
    mutationFn: async () => {
      const { data } = await api.get('/professor/reports/export');
      const blob = new Blob([data.data], { type: data.mime });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'wbcode-report.csv';
      anchor.click();
      URL.revokeObjectURL(url);
    }
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-400">Share progress with institutions</p>
        <h1 className="text-3xl font-semibold text-white">Export Reports</h1>
      </header>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-sm text-slate-300">
          Generate CSV snapshots of leaderboard standings and XP distribution for compliance or progress sharing.
        </p>
        <button
          onClick={() => exportReport.mutate()}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={exportReport.isLoading}
        >
          Export CSV
        </button>
      </div>
    </div>
  );
};

export default ReportsPage;



