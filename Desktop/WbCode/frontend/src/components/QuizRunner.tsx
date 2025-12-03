import { useState } from 'react';

type QuizQuestion = {
  id: number;
  prompt: string;
  options: string[];
  explanation: string;
};

type QuizRunnerProps = {
  questions: QuizQuestion[];
  onSubmit: (answers: Record<number, string>) => Promise<void> | void;
};

const QuizRunner = ({ questions, onSubmit }: QuizRunnerProps) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async () => {
    await onSubmit(answers);
    setFeedback('Feedback saved! Check explanations for incorrect answers.');
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      {questions.map((question) => (
        <div key={question.id}>
          <p className="font-semibold text-lg text-white">{question.prompt}</p>
          <div className="mt-2 grid gap-2">
            {question.options.map((option) => (
              <label
                key={option}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  answers[question.id] === option
                    ? 'border-primary bg-primary/10'
                    : 'border-slate-800 hover:border-primary/60'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={() => setAnswers({ ...answers, [question.id]: option })}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">{question.explanation}</p>
        </div>
      ))}
      <button onClick={handleSubmit} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
        Submit quiz
      </button>
      {feedback && <p className="text-sm text-emerald-400">{feedback}</p>}
    </div>
  );
};

export default QuizRunner;



