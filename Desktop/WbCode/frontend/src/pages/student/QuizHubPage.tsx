import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { api } from '../../api/client';
import QuizRunner from '../../components/QuizRunner';
import { FileQuestion, Clock, TrendingUp, Filter, Search, Award, Target, BookOpen, Zap } from 'lucide-react';
import classNames from 'classnames';

type Quiz = {
  id: number;
  title: string;
  description: string;
  timeLimit: number;
  lesson?: {
    difficulty: string;
    tags: string[];
    title: string;
  };
  questions: Array<{ id: number }>;
  _count?: {
    submissions: number;
  };
};

const QuizHubPage = () => {
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const { data } = await api.get('/quizzes');
      return data;
    }
  });

  const { data: selectedQuiz, isLoading: isLoadingQuiz } = useQuery({
    queryKey: ['quiz', selectedQuizId],
    queryFn: async () => {
      if (!selectedQuizId) return null;
      const { data } = await api.get(`/quizzes/${selectedQuizId}`);
      return data;
    },
    enabled: !!selectedQuizId
  });

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const matchesDifficulty = difficultyFilter === 'all' || quiz.lesson?.difficulty?.toLowerCase() === difficultyFilter.toLowerCase();
      const matchesSearch = !searchQuery || 
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.lesson?.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDifficulty && matchesSearch;
    });
  }, [quizzes, difficultyFilter, searchQuery]);

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'advanced':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const getDifficultyIcon = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return <BookOpen className="h-4 w-4" />;
      case 'intermediate':
        return <Target className="h-4 w-4" />;
      case 'advanced':
        return <Zap className="h-4 w-4" />;
      default:
        return <FileQuestion className="h-4 w-4" />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (selectedQuiz && !isLoadingQuiz) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedQuizId(null)}
            className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
          >
            ← Back to Quiz Hub
          </button>
        </div>
        <QuizRunner
          quizId={selectedQuiz.id}
          quizTitle={selectedQuiz.title}
          questions={selectedQuiz.questions.map((q: any) => ({
            id: q.id,
            prompt: q.prompt,
            options: q.options || [],
            explanation: q.explanation
          }))}
          timeLimit={selectedQuiz.timeLimit}
          onSubmit={async (answers) => {
            const payload = {
              answers: Object.entries(answers).map(([questionId, answer]) => ({
                questionId: Number(questionId),
                answer
              }))
            };
            const { data } = await api.post(`/quizzes/${selectedQuiz.id}/submit`, payload);
            return data;
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-slate-100 p-6">
      {/* Header */}
      <header className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-purple-600 p-8 shadow-lg">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ filter: 'blur(10px)' }}></div>
        <div className="relative z-10 flex items-center gap-4">
          <FileQuestion className="h-12 w-12 text-white animate-pulse" />
          <div>
            <p className="text-sm uppercase tracking-wide text-white/80">Test Your Knowledge</p>
            <h1 className="text-4xl font-extrabold text-white">Quiz Arena</h1>
          </div>
        </div>
        <p className="relative z-10 mt-4 text-lg text-white/90">
          Challenge yourself with quizzes on different topics and difficulty levels. Earn XP and track your progress!
        </p>
      </header>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quizzes by title, description, or lesson..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-400" />
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-white focus:border-primary focus:outline-none"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-4 py-2">
            <FileQuestion className="h-4 w-4 text-primary" />
            <span className="text-slate-300">
              <span className="font-semibold text-white">{filteredQuizzes.length}</span> quizzes available
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-4 py-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-slate-300">
              Total questions: <span className="font-semibold text-white">
                {filteredQuizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0)}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Quiz Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4">Loading quizzes...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-12 text-center">
          <FileQuestion className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <p className="text-xl font-semibold text-slate-300 mb-2">No quizzes found</p>
          <p className="text-slate-500">
            {searchQuery || difficultyFilter !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'No quizzes available at the moment.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              onClick={() => setSelectedQuizId(quiz.id)}
              className="group relative cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-primary/20 hover:scale-105"
            >
              {/* Difficulty Badge */}
              <div className="absolute top-4 right-4">
                <div
                  className={classNames(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
                    getDifficultyColor(quiz.lesson?.difficulty)
                  )}
                >
                  {getDifficultyIcon(quiz.lesson?.difficulty)}
                  {quiz.lesson?.difficulty || 'Unknown'}
                </div>
              </div>

              {/* Icon */}
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20">
                <FileQuestion className="h-8 w-8 text-primary" />
              </div>

              {/* Title */}
              <h3 className="mb-2 text-xl font-semibold text-white group-hover:text-primary transition-colors">
                {quiz.title}
              </h3>

              {/* Description */}
              <p className="mb-4 line-clamp-2 text-sm text-slate-400">
                {quiz.description}
              </p>

              {/* Lesson Info */}
              {quiz.lesson && (
                <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="truncate">{quiz.lesson.title}</span>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(quiz.timeLimit)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <FileQuestion className="h-4 w-4" />
                  <span>{quiz.questions?.length || 0} questions</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                  <span>+{(quiz.questions?.length || 0) * 15} XP</span>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizHubPage;
