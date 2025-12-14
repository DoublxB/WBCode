import { useMutation } from '@tanstack/react-query';
import { useMissions } from '../../api/hooks';
import MissionCard from '../../components/MissionCard';
import { api } from '../../api/client';

const MissionsPage = () => {
  const { data, refetch } = useMissions();

  const join = useMutation({
    mutationFn: (missionId: number) => api.post(`/missions/${missionId}/join`),
    onSuccess: () => refetch()
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-400">Weekly incentives</p>
        <h1 className="text-3xl font-semibold text-white">Missions & Streaks</h1>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((mission: any) => (
          <MissionCard
            key={mission.id}
            mission={{ ...mission, participants: mission.participants?.length ?? 0 }}
            onJoin={(id) => join.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
};

export default MissionsPage;












