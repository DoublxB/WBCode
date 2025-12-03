type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
};

const StatCard = ({ title, value, subtitle }: StatCardProps) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-900/40">
    <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
    <p className="text-3xl font-semibold text-white">{value}</p>
    {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
  </div>
);

export default StatCard;



