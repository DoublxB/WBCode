import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import CodeEditor from '../../components/CodeEditor';
import XPGainToast from '../../components/XPGainToast';
import SuccessScreen from '../../components/SuccessScreen';
import FailureScreen from '../../components/FailureScreen';
import SkeletonLoader from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import LevelUpModal from '../../components/LevelUpModal';
import { useLevelUpDetection } from '../../hooks/useLevelUpDetection';
import { useProfile } from '../../api/hooks';
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
  Target,
  BookOpen,
  Filter,
  Search,
  Award,
  AlertCircle,
  Maximize2,
  Minimize2,
  RotateCcw,
  Copy,
  Download
} from 'lucide-react';

const CodeLabPage = () => {
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { showLevelUp, newLevel, handleCloseLevelUp } = useLevelUpDetection();
  const [showXPGain, setShowXPGain] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');

  const { data: exercises, isLoading: exercisesLoading } = useQuery({
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
  const [typingMetrics, setTypingMetrics] = useState<{
    charsPerSecond: number;
    totalChars: number;
    timeSpent: number;
    hasLargePaste?: boolean;
    largestPasteSize?: number;
  } | null>(null);

  // Track start time when exercise changes
  useEffect(() => {
    if (exercise) {
      setStartTime(Date.now());
    }
  }, [exercise]);

  useEffect(() => {
    if (exercise?.starterCode) {
      setSource(exercise.starterCode);
      setTypingMetrics(null);
      setShowSuccess(false);
      setShowFailure(false);
      setSubmissionResult(null);
    }
  }, [exercise]);

  const runCode = useMutation({
    mutationFn: async () => {
      const codeLength = source.length;
      const timeSpent = typingMetrics?.timeSpent || 0;
      const hasLargePaste = typingMetrics?.hasLargePaste || false;
      const largestPasteSize = typingMetrics?.largestPasteSize || 0;
      
      let finalHasLargePaste = hasLargePaste;
      let finalLargestPasteSize = largestPasteSize;
      
      if (codeLength > 200 && (timeSpent < 5 || !typingMetrics)) {
        finalHasLargePaste = true;
        finalLargestPasteSize = Math.max(finalLargestPasteSize, codeLength);
      }
      
      let finalTypingSpeed = typingMetrics?.charsPerSecond || 0;
      if (finalHasLargePaste && finalTypingSpeed < 25) {
        finalTypingSpeed = 999;
      }
      
      const { data } = await api.post(`/coding/${exercise?.id}/submit`, {
        sourceCode: source,
        stdin: '',
        typingSpeed: finalTypingSpeed,
        timeSpent: timeSpent || 1,
        hasLargePaste: finalHasLargePaste,
        largestPasteSize: finalLargestPasteSize
      });
      
      return data;
    },
    onSuccess: async (data) => {
      setSubmissionResult(data);
      
      const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      const minutes = Math.floor(timeTaken / 60);
      const seconds = timeTaken % 60;
      const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      
      if (data.success && data.score === 100) {
        setShowSuccess(true);
        
        if (data.xpGain || (data.score === 100 && !data.isSuspicious)) {
          const xp = data.xpGain || 50;
          setXpGained(xp);
          setShowXPGain(true);
          await refetchProfile();
        }
      } else {
        setShowFailure(true);
      }
    }
  });

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
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

  const getTimeTaken = (): string => {
    if (!startTime) return '0s';
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  };

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter((ex: any) => {
      const matchesSearch = ex.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ex.prompt?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = difficultyFilter === 'all' || ex.difficulty?.toUpperCase() === difficultyFilter.toUpperCase();
      const matchesLanguage = languageFilter === 'all' || ex.language?.toUpperCase() === languageFilter.toUpperCase();
      return matchesSearch && matchesDifficulty && matchesLanguage;
    });
  }, [exercises, searchQuery, difficultyFilter, languageFilter]);

  const handleResetCode = () => {
    if (exercise?.starterCode) {
      setSource(exercise.starterCode);
      setTypingMetrics(null);
    }
  };

  if (exercisesLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" count={3} />
      </div>
    );
  }

  if (!exercises || exercises.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No exercises available"
        description="There are no coding exercises available at the moment. Check back later or contact your professor."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* XP Gain Toast */}
      {showXPGain && (
        <XPGainToast
          amount={xpGained}
          reason="Exercise completed!"
          onComplete={() => setShowXPGain(false)}
        />
      )}

      {/* Level Up Modal */}
      {showLevelUp && (
        <LevelUpModal
          level={newLevel}
          onClose={handleCloseLevelUp}
        />
      )}

      {/* Success Screen */}
      {showSuccess && submissionResult && (
        <SuccessScreen
          score={submissionResult.score}
          maxScore={100}
          xpGained={submissionResult.xpGain || (submissionResult.score === 100 && !submissionResult.isSuspicious ? 50 : 0)}
          timeTaken={getTimeTaken()}
          onContinue={() => {
            setShowSuccess(false);
            setSubmissionResult(null);
            setStartTime(Date.now());
          }}
          continueLabel="Continue"
        />
      )}

      {/* Failure Screen */}
      {showFailure && submissionResult && (
        <FailureScreen
          score={submissionResult.score}
          maxScore={100}
          errors={submissionResult.stderr ? [submissionResult.stderr] : undefined}
          explanation={submissionResult.explanation}
          onTryAgain={() => {
            setShowFailure(false);
            setSubmissionResult(null);
            setStartTime(Date.now());
          }}
        />
      )}

      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-3xl border border-slate-800/50 bg-gradient-to-br from-primary-500/20 via-purple-500/20 to-indigo-500/20 p-8 md:p-10 shadow-2xl">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 shadow-lg ring-4 ring-primary-500/20">
              <Code2 className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                Code Lab
                <Sparkles className="h-7 w-7 text-primary-400 animate-pulse" />
              </h1>
              <p className="text-slate-300 text-lg">
                Master Python through hands-on coding challenges
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50">
              <FileCode className="h-5 w-5 text-primary-400" />
              <span className="text-sm font-semibold text-white">{exercises.length}</span>
              <span className="text-sm text-slate-400">Exercises</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50">
              <Award className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-semibold text-white">Earn XP</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50">
              <Target className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-semibold text-white">Instant Feedback</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Symmetric Layout */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Exercises List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-800/50 bg-slate-900/80 backdrop-blur-sm p-6 shadow-xl">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary-500/20 border border-primary-500/30">
                  <FileCode className="h-5 w-5 text-primary-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Exercises</h2>
              </div>
              <span className="px-3 py-1 rounded-lg bg-primary-500/20 border border-primary-500/30 text-primary-400 text-sm font-bold">
                {filteredExercises.length}
              </span>
            </div>

            {/* Search & Filters */}
            <div className="space-y-3 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:bg-slate-800 transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="rounded-xl border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500/50"
                >
                  <option value="all">All Levels</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="rounded-xl border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500/50"
                >
                  <option value="all">All Languages</option>
                  <option value="python">Python</option>
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
            </div>

            {/* Exercises List */}
            <div className="space-y-2 max-h-[calc(100vh-28rem)] overflow-y-auto custom-scrollbar pr-2">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-12">
                  <FileCode className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No exercises found</p>
                </div>
              ) : (
                filteredExercises.map((ex: any) => (
                  <button
                    key={ex.id}
                    onClick={() => setExerciseId(ex.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      exercise?.id === ex.id
                        ? 'border-primary-500/50 bg-gradient-to-br from-primary-500/20 to-purple-500/20 shadow-lg shadow-primary-500/20 ring-2 ring-primary-500/30'
                        : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/70 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-2xl flex-shrink-0">{getLanguageIcon(ex.language)}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm mb-1 truncate">{ex.title}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2">{ex.prompt || ex.description || 'No description'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`text-[10px] px-2 py-1 rounded-md border font-semibold ${getDifficultyColor(ex.difficulty)}`}>
                        {ex.difficulty || 'MEDIUM'}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {ex.xpReward || 50}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Content - Editor & Info */}
        <div className="lg:col-span-8 space-y-6">
          {exercise ? (
            <>
              {/* Exercise Info Card */}
              <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-800/50 p-6 shadow-xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-primary-500/30">
                        <Target className="h-6 w-6 text-primary-400" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white mb-2">{exercise.title}</h2>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm text-slate-300 flex items-center gap-2">
                            <span className="text-lg">{getLanguageIcon(exercise.language)}</span>
                            <span className="font-semibold">{exercise.language}</span>
                          </span>
                          <span className={`text-xs px-3 py-1 rounded-lg border font-bold ${getDifficultyColor(exercise.difficulty)}`}>
                            {exercise.difficulty || 'MEDIUM'}
                          </span>
                          <span className="text-sm text-slate-400 flex items-center gap-1">
                            <Zap className="h-4 w-4 text-amber-400" />
                            <span className="font-semibold text-amber-400">{exercise.xpReward || 50} XP</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-slate-300 leading-relaxed text-base">{exercise.prompt || exercise.description || 'No description available.'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Code Editor Card */}
              <div className="rounded-2xl border border-slate-800/50 bg-slate-900/80 overflow-hidden shadow-xl">
                {/* Editor Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-500/20 border border-primary-500/30">
                      <Code2 className="h-5 w-5 text-primary-400" />
                    </div>
                    <span className="text-sm font-semibold text-white">Code Editor</span>
                    <span className="px-2 py-1 rounded-md bg-slate-700/50 text-xs text-slate-300 font-medium">
                      {exercise.language}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetCode}
                      className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                      title="Reset code"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Editor */}
                <div className={isExpanded ? 'h-[700px]' : 'h-[500px]'}>
                  <CodeEditor
                    language={(exercise.language ?? 'PYTHON').toLowerCase() as 'python' | 'c' | 'cpp'}
                    value={source}
                    onChange={setSource}
                    onTypingMetrics={setTypingMetrics}
                  />
                </div>

                {/* Editor Footer */}
                <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
                  <button
                    onClick={() => runCode.mutate()}
                    disabled={runCode.isPending || !source.trim()}
                    className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 px-6 py-4 font-bold text-white hover:from-primary-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {runCode.isPending ? (
                      <>
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Running Code...</span>
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
                <div className={`rounded-2xl border p-6 transition-all duration-500 shadow-xl ${
                  runCode.data.score === 100
                    ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5'
                    : runCode.data.score > 0
                    ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-amber-600/5'
                    : 'border-red-500/50 bg-gradient-to-br from-red-500/10 to-red-600/5'
                }`}>
                  <div className="flex items-center gap-3 mb-6">
                    {runCode.data.score === 100 ? (
                      <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                      </div>
                    ) : runCode.data.score > 0 ? (
                      <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
                        <AlertCircle className="h-6 w-6 text-amber-400" />
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30">
                        <XCircle className="h-6 w-6 text-red-400" />
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-white">Execution Results</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 rounded-xl bg-slate-900/50 border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <Target className="h-6 w-6 text-primary-400" />
                        <span className="font-semibold text-white text-lg">Score</span>
                      </div>
                      <div className={`text-4xl font-bold ${
                        runCode.data.score === 100
                          ? 'text-emerald-400'
                          : runCode.data.score > 0
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}>
                        {runCode.data.score}%
                      </div>
                    </div>

                    {runCode.data.stdout && (
                      <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          <span className="text-sm font-bold text-emerald-400 uppercase tracking-wide">Output</span>
                        </div>
                        <pre className="text-sm text-slate-200 font-mono whitespace-pre-wrap break-words bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                          {runCode.data.stdout}
                        </pre>
                      </div>
                    )}

                    {runCode.data.stderr && (
                      <div className="p-5 rounded-xl bg-slate-900/50 border border-red-500/30">
                        <div className="flex items-center gap-2 mb-3">
                          <XCircle className="h-5 w-5 text-red-400" />
                          <span className="text-sm font-bold text-red-400 uppercase tracking-wide">Errors</span>
                        </div>
                        <pre className="text-sm text-red-300 font-mono whitespace-pre-wrap break-words bg-slate-950/50 p-4 rounded-lg border border-red-500/20">
                          {runCode.data.stderr}
                        </pre>
                      </div>
                    )}

                    {runCode.data.xpGain && (
                      <div className="flex items-center gap-3 p-5 rounded-xl bg-gradient-to-r from-primary-500/20 to-purple-600/20 border border-primary-500/30">
                        <Zap className="h-6 w-6 text-primary-400" />
                        <span className="text-base font-bold text-primary-400">
                          +{runCode.data.xpGain} XP earned!
                        </span>
                      </div>
                    )}

                    {runCode.data.isSuspicious && (
                      <div className="flex items-center gap-3 p-5 rounded-xl bg-amber-500/20 border border-amber-500/30">
                        <AlertCircle className="h-6 w-6 text-amber-400" />
                        <span className="text-sm font-semibold text-amber-400">
                          ⚠️ Your submission was flagged for suspicious typing patterns. Please write code yourself.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {runCode.isError && (
                <div className="rounded-2xl border border-red-500/50 bg-gradient-to-br from-red-500/10 to-red-600/5 p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30">
                      <XCircle className="h-6 w-6 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-red-400">Execution Failed</h3>
                  </div>
                  <p className="text-sm text-red-300">
                    {(runCode.error as any)?.response?.data?.message || runCode.error?.message || 'An error occurred while running your code.'}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-slate-800/50 bg-slate-900/80 p-12 text-center">
              <Code2 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Select an Exercise</h3>
              <p className="text-slate-400">Choose an exercise from the sidebar to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeLabPage;
