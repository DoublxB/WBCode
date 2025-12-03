import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import CodeEditor from '../../components/CodeEditor';
import { api } from '../../api/client';
import { 
  Code2, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  TrendingUp,
  FileCode,
  Sparkles,
  Target
} from 'lucide-react';

const CodeLabPage = () => {
  const { data: exercises } = useQuery({
    queryKey: ['coding'],
    queryFn: async () => {
      const { data } = await api.get('/coding');
      return data as any[];
    }
  });
  const [exerciseId, setExerciseId] = useState<number | null>(null);
  const exercise = useMemo(() => exercises?.find((ex: any) => ex.id === exerciseId) ?? exercises?.[0], [exercises, exerciseId]);
  const [source, setSource] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (exercise?.starterCode) {
      setSource(exercise.starterCode);
    }
  }, [exercise]);

  const runCode = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/coding/${exercise?.id}/submit`, {
        sourceCode: source,
        stdin: ''
      });
      return data;
    }
  });

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'HARD':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getLanguageIcon = (language?: string) => {
    switch (language?.toUpperCase()) {
      case 'PYTHON':
        return '🐍';
      case 'C':
        return '⚙️';
      case 'CPP':
      case 'C++':
        return '⚡';
      default:
        return '💻';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with gradient */}
      <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-primary/10 via-purple-500/10 to-indigo-500/10 p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
              <Code2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Practice coding inside WBCode</p>
              <h1 className="text-4xl font-bold text-white mt-1 flex items-center gap-2">
                Code Lab
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </h1>
            </div>
          </div>
          <p className="text-slate-300 mt-3 max-w-2xl">
            Write, test, and submit your code. Get instant feedback and earn XP for solving challenges.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Exercises Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileCode className="h-5 w-5 text-primary" />
                Exercises
              </h2>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                {exercises?.length || 0}
              </span>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
              {exercises?.map((ex: any) => (
                <button
                  key={ex.id}
                  onClick={() => setExerciseId(ex.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                    exercise?.id === ex.id
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate flex items-center gap-2">
                        <span className="text-lg">{getLanguageIcon(ex.language)}</span>
                        {ex.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ex.prompt || ex.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-xs px-2 py-1 rounded border ${getDifficultyColor(ex.difficulty)}`}>
                      {ex.difficulty || 'MEDIUM'}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {ex.xpReward || 50} XP
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="lg:col-span-2 space-y-6">
          {exercise && (
            <>
              {/* Exercise Info Card */}
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-800/50 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{exercise.title}</h2>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-slate-400 flex items-center gap-1">
                            {getLanguageIcon(exercise.language)} {exercise.language}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded border ${getDifficultyColor(exercise.difficulty)}`}>
                            {exercise.difficulty || 'MEDIUM'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{exercise.prompt || exercise.description || 'No description available.'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>{exercise.xpReward || 50} XP reward</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span>Estimated: 15-30 min</span>
                  </div>
                </div>
              </div>

              {/* Editor with Controls */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <Code2 className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-white">Code Editor</span>
                    <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                      {exercise.language}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </button>
                </div>
                <div className={isExpanded ? 'h-[600px]' : 'h-[400px]'}>
                  <CodeEditor
                    language={(exercise.language ?? 'PYTHON').toLowerCase() as 'python' | 'c' | 'cpp'}
                    value={source}
                    onChange={setSource}
                  />
                </div>
                <div className="p-4 border-t border-slate-700 bg-slate-800/30">
                  <button
                    onClick={() => runCode.mutate()}
                    disabled={runCode.isLoading || !source.trim()}
                    className="w-full rounded-lg bg-gradient-to-r from-primary to-purple-600 px-6 py-3 font-semibold text-white hover:from-primary/90 hover:to-purple-600/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                  >
                    {runCode.isLoading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5" />
                        <span>Run & Auto-Grade</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Results Card */}
              {runCode.data && (
                <div className={`rounded-2xl border p-6 transition-all duration-500 ${
                  runCode.data.score === 100
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : runCode.data.score > 0
                    ? 'border-yellow-500/50 bg-yellow-500/10'
                    : 'border-red-500/50 bg-red-500/10'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    {runCode.data.score === 100 ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                    ) : runCode.data.score > 0 ? (
                      <TrendingUp className="h-6 w-6 text-yellow-400" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-400" />
                    )}
                    <h3 className="text-lg font-semibold text-white">Execution Results</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-700">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        <span className="font-medium text-white">Score</span>
                      </div>
                      <div className={`text-2xl font-bold ${
                        runCode.data.score === 100
                          ? 'text-emerald-400'
                          : runCode.data.score > 0
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}>
                        {runCode.data.score}%
                      </div>
                    </div>

                    {runCode.data.stdout && (
                      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-400">Output</span>
                        </div>
                        <pre className="text-sm text-slate-200 font-mono whitespace-pre-wrap break-words">
                          {runCode.data.stdout}
                        </pre>
                      </div>
                    )}

                    {runCode.data.stderr && (
                      <div className="p-4 rounded-xl bg-slate-900/50 border border-red-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="h-4 w-4 text-red-400" />
                          <span className="text-sm font-medium text-red-400">Errors</span>
                        </div>
                        <pre className="text-sm text-red-300 font-mono whitespace-pre-wrap break-words">
                          {runCode.data.stderr}
                        </pre>
                      </div>
                    )}

                    {runCode.data.xpGain && (
                      <div className="flex items-center gap-2 p-4 rounded-xl bg-gradient-to-r from-primary/20 to-purple-600/20 border border-primary/30">
                        <Zap className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          +{runCode.data.xpGain} XP earned!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {runCode.isError && (
                <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-6">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-6 w-6 text-red-400" />
                    <h3 className="text-lg font-semibold text-red-400">Execution Failed</h3>
                  </div>
                  <p className="text-sm text-red-300 mt-2">
                    {runCode.error?.response?.data?.message || 'An error occurred while running your code.'}
                  </p>
                </div>
              )}
            </>
          )}

          {!exercise && exercises && exercises.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-12 text-center">
              <Code2 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Exercises Available</h3>
              <p className="text-slate-400">Check back later for new coding challenges!</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>
    </div>
  );
};

export default CodeLabPage;
