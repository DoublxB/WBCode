import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useMissions, useProfile } from '../../api/hooks';
import MissionCard, { Mission } from '../../components/MissionCard';
import { api } from '../../api/client';

const MissionsPage = () => {
  const { data, refetch } = useMissions();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    api.post('/analytics/event', { type: 'MISSIONS_VIEW' }).catch(() => null);
  }, []);

  const claim = useMutation({
    mutationFn: (mission: Mission) => api.post(`/missions/${mission.id}/claim`),
    onSuccess: () => {
      refetch();
      // Track mission claim as mission engagement
      api.post('/analytics/event', { type: 'MISSION_CLAIM' }).catch(() => null);
    }
  });

  const openMission = (mission: Mission) => {
    if (mission.codingExerciseId) {
      navigate(`/missions/${mission.id}/code`);
    } else {
      navigate(`/missions/${mission.id}/solve`);
    }
  };

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
            mission={{
              ...mission,
              participants: mission.participants?.length ?? 0,
              myParticipant: profile
                ? mission.participants?.find((p: any) => p.userId === profile.id) ?? null
                : null
            }}
            onOpen={(m) => openMission(m)}
            onClaim={(m) => claim.mutate(m)}
          />
        ))}
      </div>
    </div>
  );
};

export default MissionsPage;













