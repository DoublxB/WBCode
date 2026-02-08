import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import BadgeUnlockToast, { BadgeUnlockPayload } from './BadgeUnlockToast';

const MAX_VISIBLE = 3;

const BadgeUnlockToaster = () => {
  const [queue, setQueue] = useState<BadgeUnlockPayload[]>([]);

  const { data: unlocks = [] } = useQuery({
    queryKey: ['badge-unlocks'],
    queryFn: async () => {
      const { data } = await api.get('/badges/unlocks');
      return data as BadgeUnlockPayload[];
    },
    refetchInterval: 5000
  });

  useEffect(() => {
    if (!unlocks || unlocks.length === 0) return;
    setQueue((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const merged = [...unlocks.filter((u) => !existingIds.has(u.id)), ...prev];
      // keep a reasonable queue length
      return merged.slice(0, 10);
    });
  }, [unlocks]);

  const markSeen = useMutation({
    mutationFn: async (unlockId: number) => {
      await api.post(`/badges/unlocks/${unlockId}/seen`);
    }
  });

  const onDone = useCallback(
    (unlockId: number) => {
      setQueue((prev) => prev.filter((p) => p.id !== unlockId));
      markSeen.mutate(unlockId);
    },
    [markSeen]
  );

  const visible = useMemo(() => queue.slice(0, MAX_VISIBLE), [queue]);

  if (!visible.length) return null;

  return (
    <div className="badge-toast-container">
      {visible.map((item) => (
        <BadgeUnlockToast key={item.id} item={item} onDone={onDone} />
      ))}
    </div>
  );
};

export default BadgeUnlockToaster;





