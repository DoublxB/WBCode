import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  ChevronDown,
  ChevronUp,
  FileCode,
  Code2,
  Terminal,
  AlertCircle,
  RotateCcw,
  Settings,
  Maximize2,
  Minimize2,
  Search,
  Filter,
  Lightbulb,
  X
} from 'lucide-react';
import WBCCoin from '../../components/WBCCoin';

const CodeLabPage = () => {
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { showLevelUp, newLevel, handleCloseLevelUp } = useLevelUpDetection();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const categorySlug = useMemo(() => (searchParams.get('category') || '').trim().toLowerCase(), [searchParams]);
  const [showXPGain, setShowXPGain] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [xpToastKey, setXpToastKey] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'solved', 'unsolved'
  const [showTerminal, setShowTerminal] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [exerciseStartTime, setExerciseStartTime] = useState<number | null>(null);
  const [manualStdin, setManualStdin] = useState('');
  const [hintError, setHintError] = useState<string | null>(null);

  const { data: exercises, isLoading: exercisesLoading } = useQuery({
    queryKey: ['coding'],
    queryFn: async () => {
      const { data } = await api.get('/coding');
      return data as any[];
    }
  });

  const [exerciseId, setExerciseId] = useState<number | null>(null);
  const startedExerciseIdsRef = useRef<Set<number>>(new Set());
  const [source, setSource] = useState('');
  const [typingMetrics, setTypingMetrics] = useState<{
    charsPerSecond: number;
    totalChars: number;
    timeSpent: number;
    hasLargePaste?: boolean;
    largestPasteSize?: number;
  } | null>(null);

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY':
        return 'text-green-400';
      case 'MEDIUM':
        return 'text-amber-400';
      case 'HARD':
        return 'text-red-400';
      default:
        return 'text-zinc-400';
    }
  };

  const getTimeTaken = (): string => {
    if (!startTime) return '0s';
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  };

  // IMPORTANT: When navigating from Roadmap we change only the querystring (?category=...),
  // so this page does NOT remount. If the user previously had filters like "unsolved",
  // an entire module can look "empty" after completion. Reset filters on category change.
  useEffect(() => {
    if (!categorySlug) return;
    setSearchQuery('');
    setDifficultyFilter('all');
    setStatusFilter('all');
    setExerciseId(null);
  }, [categorySlug]);

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    
    // Filtrare
    let filtered = exercises.filter((ex: any) => {
      const matchesSearch = ex.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ex.prompt?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = difficultyFilter === 'all' || ex.difficulty?.toUpperCase() === difficultyFilter.toUpperCase();

      // Roadmap category filter (optional)
      let matchesCategory = true;
      if (categorySlug) {
        const cat = String(ex.category || '').toLowerCase();
        // IMPORTANT: category filtering must be STRICT, otherwise generic tokens like "for/if"
        // can leak exercises from other modules into the selected one.
        //
        // Primary: normalized category === slug (this is how we seed the 45/module exercises).
        // Fallback: title prefix for roadmap-seeded exercises.
        const title = String(ex.title || '');
        matchesCategory = cat === categorySlug || title.startsWith(`[Roadmap:${categorySlug}]`);
      }
      
      // Filtrare după status (rezolvate/nerezolvate)
      let matchesStatus = true;
      if (statusFilter === 'solved') {
        matchesStatus = ex.isSolved === true;
      } else if (statusFilter === 'unsolved') {
        matchesStatus = ex.isSolved !== true;
      }
      
      return matchesSearch && matchesDifficulty && matchesStatus && matchesCategory;
    });
    
    // Sortare: mai întâi după dificultate (EASY -> MEDIUM -> HARD), apoi după ID
    const difficultyOrder: Record<string, number> = { 'EASY': 1, 'MEDIUM': 2, 'HARD': 3 };
    filtered.sort((a, b) => {
      const diffA = difficultyOrder[a.difficulty?.toUpperCase() || 'MEDIUM'] || 2;
      const diffB = difficultyOrder[b.difficulty?.toUpperCase() || 'MEDIUM'] || 2;
      if (diffA !== diffB) {
        return diffA - diffB;
      }
      // Dacă dificultatea e aceeași, sortează după ID (ordine logică)
      return (a.id || 0) - (b.id || 0);
    });
    
    return filtered;
  }, [exercises, searchQuery, difficultyFilter, statusFilter, categorySlug]);

  // Auto-select primul exercițiu când se încarcă
  useEffect(() => {
    if (!exerciseId && filteredExercises.length > 0) {
      setExerciseId(filteredExercises[0].id);
    }
  }, [filteredExercises, exerciseId]);

  // Funnel event: user started a CodeLab exercise (first time per tab session for that exercise)
  useEffect(() => {
    if (!exerciseId) return;
    if (startedExerciseIdsRef.current.has(exerciseId)) return;
    startedExerciseIdsRef.current.add(exerciseId);
    api.post('/analytics/event', { type: 'CODELAB_START', codingId: exerciseId }).catch(() => null);
  }, [exerciseId]);

  const exercise = useMemo(() => {
    if (exerciseId && exercises) {
      return exercises.find((ex: any) => ex.id === exerciseId);
    }
    // Dacă nu e selectat, ia primul din lista sortată
    return filteredExercises?.[0] || null;
  }, [exercises, exerciseId, filteredExercises]);

  // Track start time when exercise changes
  useEffect(() => {
    if (exercise) {
      setStartTime(Date.now());
      setExerciseStartTime(Date.now());
      setTimeElapsed(0);
      setHint(null);
      setShowHintModal(false);
    }
  }, [exercise]);

  // Calculate time limit based on difficulty
  const getTimeLimit = (difficulty?: string): number => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY':
      case 'BEGINNER':
        return 10 * 60; // 10 minutes
      case 'MEDIUM':
      case 'INTERMEDIATE':
        return 15 * 60; // 15 minutes
      case 'HARD':
      case 'ADVANCED':
        return 20 * 60; // 20 minutes
      default:
        return 15 * 60; // 15 minutes default
    }
  };

  // Track elapsed time and show hint button at 50%
  useEffect(() => {
    if (!exercise || !exerciseStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - exerciseStartTime) / 1000);
      setTimeElapsed(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [exercise, exerciseStartTime]);

  // Check if hint button should be shown (50% of time limit)
  const shouldShowHintButton = useMemo(() => {
    if (!exercise || !exerciseStartTime) return false;
    const timeLimit = getTimeLimit(exercise.difficulty);
    const halfTime = timeLimit / 2;
    return timeElapsed >= halfTime && !hint;
  }, [exercise, timeElapsed, exerciseStartTime, hint]);

  // Purchase hint mutation
  const purchaseHint = useMutation({
    mutationFn: async () => {
      if (!exercise) {
        throw new Error('No exercise selected');
      }
      const { data } = await api.post(`/coding/${exercise.id}/hint`);
      return data;
    },
    onSuccess: async (data) => {
      if (data) {
        setHint(data.hint);
        setHintError(null);
        setShowHintModal(false);
        await refetchProfile();
        // Actualizează și lista de exerciții pentru a reflecta noile WBC Coins
        queryClient.invalidateQueries({ queryKey: ['coding'] });
      }
    },
    onError: (error: any) => {
      console.error('Error purchasing hint:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to purchase hint. Please try again.';
      setHintError(errorMessage);
      // Keep modal open on error so user can try again
    }
  });

  useEffect(() => {
    if (exercise?.starterCode) {
      setSource(exercise.starterCode);
      setTypingMetrics(null);
      setShowSuccess(false);
      setShowFailure(false);
      setSubmissionResult(null);
      setShowTerminal(false);
      // Reset stdin când se schimbă exercițiul
      setManualStdin('');
    }
  }, [exercise?.id]); // Use exercise.id instead of exercise to avoid unnecessary resets

  // Helper function to extract stdin from exercise examples/testCases
  const extractStdinFromExercise = (exercise: any): string => {
    // PRIORITATE 1: Folosește stdin manual dacă utilizatorul l-a introdus
    if (manualStdin && manualStdin.trim()) {
      return manualStdin.trim();
    }
    
    // Dacă nu există stdin manual, returnăm string gol
    // Backend-ul va respinge soluția dacă stdin este gol și exercițiul necesită input
    return '';
  };

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

      // Extract stdin from exercise examples/testCases
      const stdin = extractStdinFromExercise(exercise);
      console.log('Submitting code', { exerciseId: exercise?.id, stdin, sourceLength: source.length });
      
      if (!exercise?.id) {
        throw new Error('No exercise selected');
      }
      
      const { data } = await api.post(`/coding/${exercise.id}/submit`, {
        sourceCode: source,
        stdin: stdin,
        typingSpeed: finalTypingSpeed,
        timeSpent: timeSpent || 1,
        hasLargePaste: finalHasLargePaste,
        largestPasteSize: finalLargestPasteSize
      });
      
      return data;
    },
    onError: (error: any) => {
      console.error('Error running code:', error);
      setSubmissionResult({
        success: false,
        score: 0,
        stderr: error?.response?.data?.message || error?.message || 'An error occurred while running your code',
        stdout: '',
        explanation: 'Please check your code and try again.'
      });
      setShowTerminal(true);
      setShowFailure(true);
    },
    onSuccess: async (data) => {
      console.log('🎯 Code execution successful:', data);
      console.log('📊 XP Gain check:', { 
        xpGain: data.xpGain, 
        xpGainType: typeof data.xpGain,
        xpGainUndefined: data.xpGain === undefined,
        xpGainGreaterThanZero: data.xpGain > 0,
        success: data.success,
        score: data.score,
        isSuspicious: data.isSuspicious
      });
      
      setSubmissionResult(data);
      setShowTerminal(true);
      
      const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      const minutes = Math.floor(timeTaken / 60);
      const seconds = timeTaken % 60;
      const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      
      if (data.success && data.score === 100) {
        // Verifică explicit dacă xpGain există în răspuns (poate fi 0, deci folosim !== undefined)
        if (data.xpGain !== undefined && data.xpGain > 0) {
          console.log('✅ Setting XP gain toast:', data.xpGain);
          setXpGained(data.xpGain);
          setXpToastKey(prev => prev + 1); // Increment key to force remount
          setShowXPGain(true);
          await refetchProfile();
          
          // Actualizează lista de exerciții pentru a marca problema ca rezolvată
          queryClient.invalidateQueries({ queryKey: ['coding'] });
          
          // Așteaptă puțin înainte de a afișa SuccessScreen pentru a permite toast-ului să apară
          setTimeout(() => {
            setShowSuccess(true);
          }, 500);
        } else if (data.score === 100 && !data.isSuspicious && data.xpGain === undefined) {
          // Fallback doar dacă backend-ul nu returnează xpGain (pentru compatibilitate)
          console.log('⚠️ Using fallback XP (50)');
          setXpGained(50);
          setXpToastKey(prev => prev + 1); // Increment key to force remount
          setShowXPGain(true);
          await refetchProfile();
          
          // Actualizează lista de exerciții pentru a marca problema ca rezolvată
          queryClient.invalidateQueries({ queryKey: ['coding'] });
          
          // Așteaptă puțin înainte de a afișa SuccessScreen pentru a permite toast-ului să apară
          setTimeout(() => {
            setShowSuccess(true);
          }, 500);
        } else {
          setShowSuccess(true);
        }
      } else {
        setShowFailure(true);
      }
    }
  });

  const handleResetCode = () => {
    if (exercise?.starterCode) {
      setSource(exercise.starterCode);
      setTypingMetrics(null);
    }
  };


  if (exercisesLoading) {
    return (
      <div className="h-screen bg-slate-950">
        <SkeletonLoader type="card" count={3} />
      </div>
    );
  }

  if (!exercises || exercises.length === 0) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <EmptyState
          icon={FileCode}
          title="No exercises available"
          description="There are no coding exercises available at the moment. Check back later or contact your professor."
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* XP Gain Toast */}
      {showXPGain && xpGained > 0 && (
        <XPGainToast
          key={`xp-toast-${xpToastKey}`}
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
          xpGained={submissionResult.xpGain !== undefined ? submissionResult.xpGain : (submissionResult.score === 100 && !submissionResult.isSuspicious ? 50 : 0)}
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

      {/* Hint Purchase Modal */}
      {showHintModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl border border-amber-500/30 p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Lightbulb className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Purchase Hint</h3>
              </div>
              <button
                onClick={() => {
                  setShowHintModal(false);
                  setHintError(null);
                }}
                className="p-1.5 rounded-md hover:bg-slate-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-zinc-300">
                Get a helpful hint to guide you in solving this problem. This will cost you <span className="font-semibold text-amber-400">50 WBC Coins</span>.
              </p>

              <div className="flex items-center justify-between p-3 rounded-md bg-slate-950/50 border border-white/5">
                <span className="text-sm text-zinc-400">Your Balance</span>
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0">
                    <WBCCoin size="sm" animation="none" />
                  </div>
                  <span className="text-sm font-semibold text-amber-400">{profile?.wbcCoins || 0} WBC</span>
                </div>
              </div>

              {profile && (profile.wbcCoins ?? 0) < 50 && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30">
                  <p className="text-xs text-red-400">
                    Insufficient WBC Coins. You need {50 - (profile.wbcCoins ?? 0)} more coins to purchase this hint.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowHintModal(false);
                    setHintError(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-white/5 bg-slate-800/50 text-zinc-300 hover:bg-slate-800 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setHintError(null);
                    purchaseHint.mutate();
                  }}
                  disabled={purchaseHint.isPending || (profile && (profile.wbcCoins ?? 0) < 50)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20 text-sm"
                >
                  {purchaseHint.isPending ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    </>
                  ) : (
                    <>
                      <span>Purchase for 50 WBC</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Code2 className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-semibold text-white">Code Lab</span>
          </div>
          
          {exercise && (
            <>
              <div className="h-4 w-px bg-white/10" />
              <span className="text-sm font-medium text-zinc-300">{exercise.title}</span>
              <span className={`text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                {exercise.difficulty || 'MEDIUM'}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          {startTime && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/50 border border-white/5">
              <Clock className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-mono text-zinc-300">{getTimeTaken()}</span>
            </div>
          )}

          {/* WBC Coins Badge */}
          {profile && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:from-amber-500/20 hover:to-orange-500/20 transition-all glow-effect">
              <div className="flex-shrink-0">
                <WBCCoin size="sm" animation="none" />
              </div>
              <span className="text-sm font-semibold text-amber-400">{profile.wbcCoins || 0}</span>
              <span className="text-xs text-amber-400/70">WBC</span>
            </div>
          )}

          {/* Run Button - Primary CTA */}
          <button
            onClick={() => {
              console.log('Run button clicked', { exercise, source: source.trim(), manualStdin });
              if (!exercise) {
                console.error('No exercise selected');
                return;
              }
              if (!source.trim()) {
                console.error('No source code');
                return;
              }
              runCode.mutate();
            }}
            disabled={runCode.isPending || !source.trim() || !exercise}
            className="btn-press flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-sm hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
          >
            {runCode.isPending ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Run</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content - 3 Column Layout: Sidebar | Problem | Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Exercises List (20%) */}
        <div className="w-[20%] flex flex-col border-r border-white/5 bg-slate-900/30">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <FileCode className="h-4 w-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-white">Exercises</h2>
              <span className="ml-auto text-xs text-zinc-500 bg-slate-800 px-2 py-0.5 rounded">
                {filteredExercises.length}
              </span>
            </div>

          {(searchQuery || difficultyFilter !== 'all' || statusFilter !== 'all' || categorySlug) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDifficultyFilter('all');
                setStatusFilter('all');
              }}
              className="mb-3 w-full btn-press rounded-md border border-white/5 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-950/80"
              title="Reset search & filters"
            >
              Reset filters
            </button>
          )}

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-md bg-slate-950 border border-white/5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-2 py-1.5 rounded-md bg-slate-950 border border-white/5 text-xs text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="all">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 rounded-md bg-slate-950 border border-white/5 text-xs text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="all">All</option>
                <option value="solved">Rezolvate</option>
                <option value="unsolved">Nerezolvate</option>
              </select>
            </div>
          </div>

          {/* Exercises List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {filteredExercises.length === 0 ? (
              <div className="text-center py-8">
                <FileCode className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">No exercises found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredExercises.map((ex: any) => (
                  <button
                    key={ex.id}
                    onClick={() => setExerciseId(ex.id)}
                    className={`w-full text-left p-3 rounded-md transition-all relative ${
                      exercise?.id === ex.id
                        ? 'bg-blue-500/10 border border-blue-500/30 shadow-sm'
                        : 'hover:bg-slate-800/50 border border-transparent'
                    } ${ex.isSolved ? 'bg-success-500/5 border-success-500/20' : ''}`}
                  >
                    {/* Checkmark pentru probleme rezolvate */}
                    {ex.isSolved && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="h-4 w-4 text-success-500 animate-scale-in" />
                      </div>
                    )}
                    <div className="flex items-start gap-2 mb-1">
                      <span className="text-lg flex-shrink-0">
                        {ex.language?.toUpperCase() === 'PYTHON' ? '🐍' :
                         ex.language?.toUpperCase() === 'C' ? '⚙️' :
                         ex.language?.toUpperCase() === 'CPP' ? '⚡' : '💻'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-xs font-semibold truncate mb-0.5 ${
                          ex.isSolved ? 'text-success-400' : 'text-white'
                        }`}>
                          {ex.title}
                        </h3>
                        <p className="text-[10px] text-zinc-500 line-clamp-2">{ex.prompt || ex.description || 'No description'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getDifficultyColor(ex.difficulty)}`}>
                        {ex.difficulty || 'MEDIUM'}
                      </span>
                      <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                        <Zap className="h-2.5 w-2.5 text-amber-400" />
                        {ex.xpReward || 50}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle Panel - Problem Description (30%) */}
        <div className="w-[30%] flex flex-col border-r border-white/5 bg-slate-900/30">
          {exercise ? (
            <>
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <h1 className="text-2xl font-bold text-white mb-4">{exercise.title}</h1>
                
                <div className="prose prose-invert max-w-none mb-6">
                  <p className="text-zinc-300 leading-relaxed text-sm mb-4">
                    {exercise.prompt || exercise.description || 'No description available.'}
                  </p>
                </div>

                {/* Examples Section */}
                {(() => {
                  const examples = Array.isArray((exercise as any)?.examples)
                    ? (exercise as any).examples
                    : Array.isArray((exercise as any)?.testCases)
                    ? (exercise as any).testCases
                    : [];
                  if (examples.length === 0) return null;
                  return (
                  <div className="mt-6 space-y-4">
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">Exemple</h2>
                    <div className="space-y-3">
                      {examples.map((example: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-md bg-slate-950 border border-white/5">
                          <div className="space-y-2">
                            <div>
                              <span className="text-xs font-semibold text-zinc-400 uppercase">Intrare:</span>
                              <pre className="mt-1 text-sm text-zinc-200 font-mono bg-slate-900 p-2 rounded border border-white/5">
                                {example.input || example.stdin || 'N/A'}
                              </pre>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-zinc-400 uppercase">Ieșire:</span>
                              <pre className="mt-1 text-sm text-zinc-200 font-mono bg-slate-900 p-2 rounded border border-white/5">
                                {example.output || example.stdout || 'N/A'}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                })()}

                {/* Constraints */}
                {exercise.constraints && (
                  <div className="mt-6 p-4 rounded-md bg-slate-950/50 border border-white/5">
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">Constraints</h2>
                    <p className="text-sm text-zinc-300 font-mono">{exercise.constraints}</p>
                  </div>
                )}

                {/* Hint Section */}
                {hint && (
                  <div className="mt-6 p-4 rounded-md bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-amber-400 mb-2">Hint</h3>
                        <p className="text-sm text-amber-200/90 leading-relaxed">{hint}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hint Button - Shows at 50% of time limit */}
                {shouldShowHintButton && !hint && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowHintModal(true)}
                      className="btn-press w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:from-amber-500/30 hover:to-orange-500/30 transition-all text-amber-400 font-semibold text-sm glow-effect"
                    >
                      <Lightbulb className="h-4 w-4" />
                      <span>Get Hint</span>
                      <span className="ml-auto flex items-center gap-2 text-xs">
                        <div className="flex-shrink-0">
                          <WBCCoin size="sm" animation="none" />
                        </div>
                        <span>50</span>
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Info Bar */}
              <div className="h-12 flex items-center justify-between px-6 border-t border-white/5 bg-slate-900/50">
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="font-mono">{exercise.language}</span>
                  <span className="h-3 w-px bg-white/10" />
                  <span className={`font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                    {exercise.difficulty || 'MEDIUM'}
                  </span>
                  <span className="h-3 w-px bg-white/10" />
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-400" />
                    <span className="text-amber-400">{exercise.xpReward || 50} XP</span>
                  </span>
                </div>
                <button
                  onClick={handleResetCode}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-800 text-zinc-400 hover:text-white transition-colors text-xs"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileCode className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">Select an exercise to begin</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Code Editor (50%) */}
        <div className="flex-1 flex flex-col bg-slate-950">
          {exercise ? (
            <>
              {/* Tab Bar */}
              <div className="h-10 flex items-center justify-between px-4 border-b border-white/5 bg-slate-900/30">
                <div className="flex items-center gap-2">
                  <FileCode className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-xs font-mono text-zinc-400">
                    solution.{exercise.language?.toLowerCase() === 'python' ? 'py' : exercise.language?.toLowerCase() === 'c' ? 'c' : 'cpp'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                    className="p-1.5 rounded hover:bg-slate-800 text-zinc-400 hover:text-white transition-colors"
                    title={isEditorExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isEditorExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  language={(exercise.language ?? 'PYTHON').toLowerCase() as 'python' | 'c' | 'cpp'}
                  value={source}
                  onChange={setSource}
                  onTypingMetrics={setTypingMetrics}
                />
              </div>

              {/* Input Panel (Terminal Style) */}
              <div className="border-t border-white/5 bg-slate-900/50">
                <div className="h-10 flex items-center justify-between px-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-xs font-mono text-zinc-400">Input (stdin)</span>
                    <span className="text-xs text-zinc-500 hidden sm:inline">- Separate values with newlines</span>
                  </div>
                  {manualStdin && (
                    <button
                      onClick={() => setManualStdin('')}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded hover:bg-slate-800/50"
                      title="Clear input"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                <div className="p-3 bg-slate-950/50">
                  <textarea
                    value={manualStdin}
                    onChange={(e) => setManualStdin(e.target.value)}
                    placeholder="Enter input values (one per line)&#10;Example for 'Suma a două numere':&#10;5&#10;3"
                    className="w-full h-20 px-3 py-2 bg-slate-950 border border-white/5 rounded-md text-sm font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none custom-scrollbar"
                    spellCheck={false}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-zinc-500">
                      {manualStdin.trim() ? (
                        <span className="text-blue-400">Using manual input ({manualStdin.trim().split('\n').length} line{manualStdin.trim().split('\n').length !== 1 ? 's' : ''})</span>
                      ) : (
                        <span>Auto-generated from examples (or leave empty)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Code2 className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                <p className="text-sm text-zinc-400">Select an exercise to start coding</p>
              </div>
            </div>
          )}

          {/* Terminal/Output Panel (Collapsible) */}
          {showTerminal && submissionResult && (
            <div className="border-t border-white/5 bg-slate-900/50">
              <button
                onClick={() => setShowTerminal(!showTerminal)}
                className="w-full h-10 flex items-center justify-between px-4 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-300 uppercase">Output</span>
                  {submissionResult.score !== undefined && (
                    <span className={`text-xs font-bold ${
                      submissionResult.score === 100 ? 'text-green-400' :
                      submissionResult.score > 0 ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {submissionResult.score}%
                    </span>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              </button>
              
              <div className="max-h-64 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {/* Score */}
                <div className="flex items-center justify-between p-3 rounded-md bg-slate-950 border border-white/5">
                  <span className="text-sm font-semibold text-zinc-300">Score</span>
                  <span className={`text-lg font-bold ${
                    submissionResult.score === 100 ? 'text-green-400' :
                    submissionResult.score > 0 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {submissionResult.score}%
                  </span>
                </div>

                {/* Output */}
                {submissionResult.stdout && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-xs font-semibold text-green-400 uppercase">Output</span>
                    </div>
                    <pre className="text-xs text-zinc-200 font-mono whitespace-pre-wrap break-words bg-slate-950 p-3 rounded-md border border-white/5">
                      {submissionResult.stdout}
                    </pre>
                  </div>
                )}

                {/* Errors */}
                {submissionResult.stderr && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-400" />
                      <span className="text-xs font-semibold text-red-400 uppercase">Errors</span>
                    </div>
                    <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap break-words bg-slate-950 p-3 rounded-md border border-red-500/20">
                      {submissionResult.stderr}
                    </pre>
                  </div>
                )}

                {/* XP Gain */}
                {submissionResult.xpGain !== undefined && submissionResult.xpGain > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <Zap className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">
                      +{submissionResult.xpGain} XP earned!
                    </span>
                  </div>
                )}

                {/* Suspicious Warning */}
                {submissionResult.isSuspicious && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400">
                      ⚠️ Your submission was flagged for suspicious typing patterns.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeLabPage;
