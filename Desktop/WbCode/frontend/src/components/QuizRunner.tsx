import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, ArrowRight, ArrowLeft, Trophy, TrendingUp, AlertCircle } from 'lucide-react';
import SuccessScreen from './SuccessScreen';
import XPGainToast from './XPGainToast';
import { useLevelUpDetection } from '../hooks/useLevelUpDetection';
import LevelUpModal from './LevelUpModal';
import { useProfile } from '../api/hooks';
import classNames from 'classnames';

type QuizQuestion = {
  id: number;
  prompt: string;
  options: string[];
  explanation: string;
};

type QuizRunnerProps = {
  quizId: number;
  quizTitle: string;
  questions: QuizQuestion[];
  timeLimit: number; // in seconds
  onSubmit: (answers: Record<number, string>) => Promise<{ score: number; maxScore: number; xpGain: number; feedback: string[] }>;
};

const QuizRunner = ({ quizId, quizTitle, questions, timeLimit, onSubmit }: QuizRunnerProps) => {
  const { refetch: refetchProfile } = useProfile();
  const { showLevelUp, newLevel, handleCloseLevelUp } = useLevelUpDetection();
  const [showXPGain, setShowXPGain] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [startTime] = useState(Date.now());
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number; xpGain: number; feedback: string[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  // Timer effect
  useEffect(() => {
    if (isSubmitted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitted]);

  const handleAutoSubmit = async () => {
    if (isSubmitted || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await onSubmit(answers);
      setResult(result);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await onSubmit(answers);
      setResult(result);
      setIsSubmitted(true);
      
      // Show XP gain and success screen
      if (result.xpGain > 0) {
        setXpGained(result.xpGain);
        setShowXPGain(true);
        setTimeout(async () => {
          await refetchProfile();
        }, 500);
      }
      
      // Show success screen for good scores
      if (result.score / result.maxScore >= 0.7) {
        setShowSuccess(true);
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionResult = (questionId: number) => {
    if (!result || !isSubmitted) return null;
    const userAnswer = answers[questionId];
    const question = questions.find((q) => q.id === questionId);
    if (!question) return null;
    // We need to check if the answer is correct - for now, we'll show based on feedback
    // In a real implementation, the backend would return which questions were correct
    return null; // Will be determined by backend response
  };

  // Calculate time taken
  const getTimeTaken = (): string => {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  };

  // Show success screen for good scores
  if (showSuccess && result && result.score / result.maxScore >= 0.7) {
    return (
      <>
        {showXPGain && (
          <XPGainToast
            amount={xpGained}
            reason="Quiz completed!"
            onComplete={() => setShowXPGain(false)}
          />
        )}
        {showLevelUp && (
          <LevelUpModal
            level={newLevel}
            onClose={handleCloseLevelUp}
          />
        )}
        <SuccessScreen
          score={result.score}
          maxScore={result.maxScore}
          xpGained={result.xpGain}
          timeTaken={getTimeTaken()}
          onContinue={() => setShowSuccess(false)}
          continueLabel="Review Answers"
        />
      </>
    );
  }

  if (isSubmitted && result) {
    const percentage = (result.score / result.maxScore) * 100;
    const isPerfect = result.score === result.maxScore;

    return (
      <div className="min-h-full bg-zinc-950 text-white p-6">
        {showXPGain && (
          <XPGainToast
            amount={xpGained}
            reason="Quiz completed!"
            onComplete={() => setShowXPGain(false)}
          />
        )}
        {showLevelUp && (
          <LevelUpModal
            level={newLevel}
            onClose={handleCloseLevelUp}
          />
        )}
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Result Header */}
          <div
            className={classNames(
              'rounded-xl border p-8 text-center',
              isPerfect
                ? 'border-green-500/40 bg-green-500/10'
                : percentage >= 70
                ? 'border-amber-500/40 bg-amber-500/10'
                : 'border-red-500/40 bg-red-500/10'
            )}
          >
            <div className="mb-4 flex justify-center">
              {isPerfect ? (
                <Trophy className="h-20 w-20 text-green-400" />
              ) : percentage >= 70 ? (
                <CheckCircle className="h-20 w-20 text-amber-400" />
              ) : (
                <XCircle className="h-20 w-20 text-red-400" />
              )}
            </div>
            <h2 className="mb-2 text-4xl font-extrabold text-white">
              {isPerfect ? 'Perfect Score!' : percentage >= 70 ? 'Well Done!' : 'Keep Practicing!'}
            </h2>
            <p className="mb-6 text-xl text-zinc-300">
              You scored <span className="font-bold text-white">{result.score}</span> out of{' '}
              <span className="font-bold text-white">{result.maxScore}</span>
            </p>
            <div className="flex items-center justify-center gap-4 text-lg">
              <div className="flex items-center gap-2 text-green-400">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">+{result.xpGain} XP</span>
              </div>
            </div>
          </div>

          {/* Questions Review */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-white">Review Your Answers</h3>
            {questions.map((question, index) => {
              const userAnswer = answers[question.id];
              const isCorrect = result.feedback.findIndex((f) => f.includes(question.prompt)) === -1;
              return (
                <div
                  key={question.id}
                  className={classNames(
                    'rounded-xl border p-6',
                    isCorrect
                      ? 'border-green-500/40 bg-green-500/5'
                      : 'border-red-500/40 bg-red-500/5'
                  )}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {isCorrect ? (
                        <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-zinc-400">Question {index + 1}</p>
                        <p className="text-lg font-semibold text-white">{question.prompt}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 space-y-2">
                    {question.options.map((option) => {
                      const isSelected = userAnswer === option;
                      return (
                        <div
                          key={option}
                          className={classNames(
                            'rounded-lg border p-3 text-sm',
                            isSelected
                              ? isCorrect
                                ? 'border-green-500 bg-green-500/20 text-green-200'
                                : 'border-red-500 bg-red-500/20 text-red-200'
                              : 'border-white/5 bg-zinc-900/50 text-zinc-300'
                          )}
                        >
                          {option}
                          {isSelected && (
                            <span className="ml-2 text-xs">
                              {isCorrect ? '✓ Correct' : '✗ Your answer'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!isCorrect && question.explanation && (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-amber-300 mb-1">Explanation</p>
                          <p className="text-sm text-amber-200/80">{question.explanation}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-950 text-white p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-white/5 bg-zinc-900/30 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{quizTitle}</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className={`flex items-center gap-2 rounded-md border px-4 py-2 ${
              timeRemaining < 60 
                ? 'border-red-500/30 bg-red-500/10' 
                : 'border-white/5 bg-zinc-900/50'
            }`}>
              <Clock className={classNames('h-4 w-4', timeRemaining < 60 ? 'text-red-400' : 'text-zinc-400')} />
              <span className={classNames('font-mono text-sm font-semibold', timeRemaining < 60 ? 'text-red-400' : 'text-white')}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
            <span>{answeredCount} of {questions.length} answered</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>

        {/* Question Card */}
        <div className="rounded-xl border border-white/5 bg-zinc-900/30 p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-zinc-400 mb-2">Question {currentQuestionIndex + 1}</p>
            <h2 className="text-xl font-bold text-white">{currentQuestion.prompt}</h2>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option;
              return (
                <label
                  key={option}
                  className={classNames(
                    'block cursor-pointer rounded-lg border p-4 transition-all duration-200',
                    isSelected
                      ? 'border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/20'
                      : 'border-white/5 bg-zinc-900/50 text-zinc-300 hover:border-blue-500/50 hover:bg-zinc-900'
                  )}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={isSelected}
                    onChange={() => setAnswers({ ...answers, [currentQuestion.id]: option })}
                    className="mr-3 h-4 w-4 accent-blue-500"
                  />
                  <span className="text-base">{option}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 rounded-lg border border-white/5 bg-zinc-900/50 px-6 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-500/50 hover:bg-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="flex gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={classNames(
                  'h-2 w-2 rounded-full transition-all',
                  index === currentQuestionIndex
                    ? 'bg-blue-500 w-8'
                    : answers[questions[index].id]
                    ? 'bg-green-500'
                    : 'bg-zinc-700 hover:bg-zinc-600'
                )}
                title={`Question ${index + 1}`}
              />
            ))}
          </div>

          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-white font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || answeredCount < questions.length}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 font-semibold text-white hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/20"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              <Trophy className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizRunner;
