import { useMutation, useQuery } from '@tanstack/react-query';
import QuizRunner from '../../components/QuizRunner';
import { api } from '../../api/client';

const QuizHubPage = () => {
  const { data: quiz } = useQuery({
    queryKey: ['quiz', 1],
    queryFn: async () => {
      const { data } = await api.get('/quizzes/1');
      return data;
    }
  });

  const submit = useMutation({
    mutationFn: async (answers: Record<number, string>) => {
      const payload = { answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId: Number(questionId), answer })) };
      const { data } = await api.post(`/quizzes/${quiz?.id}/submit`, payload);
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-400">Master CS fundamentals</p>
        <h1 className="text-3xl font-semibold text-white">Quiz Arena</h1>
      </header>
      {quiz && (
        <QuizRunner
          questions={quiz.questions.map((q: any) => ({
            id: q.id,
            prompt: q.prompt,
            options: q.options,
            explanation: q.explanation
          }))}
          onSubmit={(answers) => submit.mutateAsync(answers)}
        />
      )}
      {submit.data && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <p className="font-semibold">Score: {submit.data.score}/{submit.data.maxScore}</p>
          <p>XP gained: {submit.data.xpGain}</p>
        </div>
      )}
    </div>
  );
};

export default QuizHubPage;



