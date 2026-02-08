import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { FileQuestion, Filter, Search, TrendingUp, BookOpen, Target, Zap, ArrowRight } from 'lucide-react';
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

const QuizExplorePage = () => {
  const navigate = useNavigate();
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const { data } = await api.get('/quizzes');
      return data;
    }
  });

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const matchesDifficulty =
        difficultyFilter === 'all' || quiz.lesson?.difficulty?.toLowerCase() === difficultyFilter.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.lesson?.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDifficulty && matchesSearch;
    });
  }, [quizzes, difficultyFilter, searchQuery]);

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'text-emerald-300';
      case 'intermediate':
        return 'text-amber-300';
      case 'advanced':
        return 'text-rose-300';
      default:
        return 'text-slate-300';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Explorează Quiz-uri</h1>
          <p className="mt-1 text-sm text-slate-300">
            Aici găsești toate quiz-urile existente (negrupate). Pentru progres ghidat, folosește track‑urile.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
          <FileQuestion className="h-4 w-4 text-blue-300" />
          <span className="text-sm font-semibold text-slate-100">{filteredQuizzes.length}</span>
          <span className="text-xs text-slate-400">quiz-uri</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Caută quiz-uri..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-800 bg-slate-950/40 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none transition-colors"
            >
              <option value="all">Toate nivelele</option>
              <option value="beginner">Începător</option>
              <option value="intermediate">Intermediar</option>
              <option value="advanced">Avansat</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2 rounded-lg bg-slate-900/40 border border-slate-800 px-3 py-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-slate-300">
              Total întrebări:{' '}
              <span className="font-semibold text-white">
                {filteredQuizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0)}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Quiz Grid */}
      {isLoading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-10 text-center text-slate-300">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-4">Se încarcă quiz-urile...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-10 text-center">
          <FileQuestion className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-200 mb-2">Nu am găsit quiz-uri</p>
          <p className="text-slate-400 text-sm">
            {searchQuery || difficultyFilter !== 'all'
              ? 'Încearcă să schimbi filtrele sau termenul de căutare.'
              : 'Nu există quiz-uri disponibile momentan.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quiz) => (
            <button
              key={quiz.id}
              onClick={() => navigate(`/quizzes/play/${quiz.id}`, { state: { from: '/quizzes/explore' } })}
              className="btn-press group relative text-left rounded-xl border border-slate-800 bg-slate-900/20 p-6 transition-all duration-300 hover:border-blue-500/30 hover:bg-slate-900/35 hover:shadow-lg hover:shadow-blue-500/10"
            >
              {/* Difficulty Badge */}
              <div className="absolute top-4 right-4">
                <div
                  className={classNames(
                    'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium',
                    `border-slate-800 bg-slate-950/40 ${getDifficultyColor(quiz.lesson?.difficulty)}`
                  )}
                >
                  {getDifficultyIcon(quiz.lesson?.difficulty)}
                  {quiz.lesson?.difficulty || '—'}
                </div>
              </div>

              {/* Icon */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20">
                <FileQuestion className="h-6 w-6 text-blue-300" />
              </div>

              {/* Title */}
              <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                {quiz.title}
              </h3>

              {/* Description */}
              <p className="mb-4 line-clamp-2 text-sm text-slate-300/90">{quiz.description}</p>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <FileQuestion className="h-3.5 w-3.5" />
                  {quiz.questions?.length || 0} întrebări
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="font-mono">{formatTime(quiz.timeLimit)}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-blue-300 font-semibold">
                  Start <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizExplorePage;


