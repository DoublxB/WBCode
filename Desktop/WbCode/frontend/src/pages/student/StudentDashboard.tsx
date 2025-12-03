import StatCard from '../../components/StatCard';
import ProgressChart from '../../components/ProgressChart';
import { useLessons, useLeaderboard, useProfile } from '../../api/hooks';

const StudentDashboard = () => {
  const { data: profile } = useProfile();
  const { data: lessons } = useLessons();
  const { data: leaderboard } = useLeaderboard();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-400">Welcome back</p>
        <h1 className="text-3xl font-semibold text-white">{profile?.firstName}, ready to push your streak?</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="XP" value={profile?.xp ?? 0} subtitle="Earn XP by passing quizzes and coding" />
        <StatCard title="Level" value={profile?.level ?? 1} subtitle="Level up every 100 XP" />
        <StatCard title="Active streak" value={`${profile?.streak ?? 0} days`} />
        <StatCard title="Rank" value={`#${leaderboard?.[0]?.rank ?? 0}`} />
      </div>
      <ProgressChart
        labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
        values={[10, 50, 75, 120, profile?.xp ?? 0, (profile?.xp ?? 0) + 40, (profile?.xp ?? 0) + 60]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-xl font-semibold text-white">Lessons</h2>
          <p className="text-sm text-slate-400">Continue the structured path curated by your professor.</p>
          <div className="mt-4 space-y-3">
            {lessons?.map((lesson: any) => (
              <div key={lesson.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs uppercase text-slate-500">{lesson.difficulty}</p>
                <h3 className="text-lg font-semibold text-white">{lesson.title}</h3>
                <p className="text-sm text-slate-400">{lesson.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-xl font-semibold text-white">Leaderboard snapshot</h2>
          <p className="text-sm text-slate-400">Friendly competition keeps streaks alive.</p>
          <div className="mt-4 space-y-2">
            {leaderboard?.slice(0, 5).map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between rounded-lg bg-slate-950/50 px-3 py-2">
                <span className="text-sm text-slate-200">
                  #{entry.rank} {entry.user.firstName}
                </span>
                <span className="text-primary font-semibold">{entry.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;



