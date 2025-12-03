import { FormEvent, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import ChallengeCard from '../../components/ChallengeCard';
import { api } from '../../api/client';

const ChallengesPage = () => {
  const { data, refetch } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const { data: response } = await api.get('/challenges');
      return response as any[];
    }
  });
  const [form, setForm] = useState({ opponentId: '', codingExerciseId: '' });
  const createChallenge = useMutation({
    mutationFn: () =>
      api.post('/challenges', {
        opponentId: Number(form.opponentId),
        codingExerciseId: Number(form.codingExerciseId)
      }),
    onSuccess: () => {
      setForm({ opponentId: '', codingExerciseId: '' });
      refetch();
    }
  });
  const acceptChallenge = useMutation({
    mutationFn: (id: number) => api.post(`/challenges/${id}/accept`),
    onSuccess: () => refetch()
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    createChallenge.mutate();
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-400">Challenge friends</p>
        <h1 className="text-3xl font-semibold text-white">Duels & Bonus XP</h1>
      </header>
      <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 md:grid-cols-3">
        <input
          type="number"
          placeholder="Friend user ID"
          value={form.opponentId}
          onChange={(e) => setForm({ ...form, opponentId: e.target.value })}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          required
        />
        <input
          type="number"
          placeholder="Coding exercise ID"
          value={form.codingExerciseId}
          onChange={(e) => setForm({ ...form, codingExerciseId: e.target.value })}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          required
        />
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={createChallenge.isLoading}>
          Send challenge
        </button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={{
              id: challenge.id,
              challenger: challenge.challengerId,
              opponent: challenge.opponentId,
              status: challenge.status,
              codingExercise: `Exercise #${challenge.codingExerciseId}`,
              bonusXP: challenge.bonusXP
            }}
            onAccept={(id) => acceptChallenge.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
};

export default ChallengesPage;



