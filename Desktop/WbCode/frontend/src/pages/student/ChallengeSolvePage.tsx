import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client';
import CodeEditor from '../../components/CodeEditor';
import { 
  Clock, 
  Play, 
  CheckCircle, 
  XCircle, 
  Trophy,
  User,
  Zap,
  ArrowLeft,
  FileCode,
  Terminal,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface Challenge {
  id: number;
  challengerId: number;
  opponentId: number;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'FAILED';
  codingExercise: {
    id: number;
    title: string;
    prompt: string;
    starterCode: string;
    difficulty: string;
    language: 'C' | 'CPP' | 'PYTHON';
    category?: string;
  };
  challenger?: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  opponent?: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  challengerScore?: number;
  opponentScore?: number;
}

const ChallengeSolvePage = () => {
  const { id } = useParams<{ id: string }>();
  const challengeId = id ? parseInt(id) : null;
  const navigate = useNavigate();
  
  const [code, setCode] = useState('');
  const [stdin, setStdin] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [typingMetrics, setTypingMetrics] = useState<{
    charsPerSecond: number;
    totalChars: number;
    timeSpent: number;
    hasLargePaste?: boolean;
    largestPasteSize?: number;
  } | null>(null);
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Fetch challenge details
  const { data: challenge, isLoading } = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: async () => {
      if (!challengeId) return null;
      const { data } = await api.get(`/challenges`);
      const challenges = data as Challenge[];
      return challenges.find(c => c.id === challengeId) || null;
    },
    enabled: !!challengeId
  });

  // Calculate time based on difficulty
  const getTimeLimit = (difficulty: string): number => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
      case 'easy':
        return 2 * 60; // 2 minutes
      case 'intermediate':
      case 'medium':
        return 5 * 60; // 5 minutes
      case 'advanced':
      case 'hard':
        return 10 * 60; // 10 minutes
      default:
        return 3 * 60; // 3 minutes default
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY':
      case 'BEGINNER':
        return 'text-green-400';
      case 'MEDIUM':
      case 'INTERMEDIATE':
        return 'text-amber-400';
      case 'HARD':
      case 'ADVANCED':
        return 'text-red-400';
      default:
        return 'text-zinc-400';
    }
  };

  // Initialize timer when challenge is loaded
  useEffect(() => {
    if (challenge?.codingExercise && !hasStarted) {
      const timeLimit = getTimeLimit(challenge.codingExercise.difficulty);
      setTimeRemaining(timeLimit);
      setCode(challenge.codingExercise.starterCode || '');
    }
  }, [challenge, hasStarted]);

  // Start timer when user starts coding
  useEffect(() => {
    if (hasStarted && timeRemaining > 0 && !isTimeUp) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTimeUp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }
  }, [hasStarted, isTimeUp]);

  // Start challenge when user first types
  const handleCodeChange = (value: string) => {
    if (!hasStarted && value !== challenge?.codingExercise.starterCode) {
      setHasStarted(true);
      startTimeRef.current = Date.now();
    }
    setCode(value);
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Run code mutation
  const runCode = useMutation({
    mutationFn: async () => {
      if (!challenge?.codingExercise) return null;
      
      const { data } = await api.post(`/coding/${challenge.codingExercise.id}/submit`, {
        sourceCode: code,
        stdin: stdin,
        typingSpeed: typingMetrics?.charsPerSecond || 0,
        timeSpent: typingMetrics?.timeSpent || 0,
        hasLargePaste: typingMetrics?.hasLargePaste || false,
        largestPasteSize: typingMetrics?.largestPasteSize || 0
      });
      setShowTerminal(true);
      return data;
    }
  });

  // Submit challenge solution
  const submitChallenge = useMutation({
    mutationFn: async () => {
      if (!challengeId || !challenge?.codingExercise) return null;
      
      // Final check for large paste if metrics are missing or suspicious
      let finalHasLargePaste = typingMetrics?.hasLargePaste || false;
      let finalLargestPasteSize = typingMetrics?.largestPasteSize || 0;
      let finalTypingSpeed = typingMetrics?.charsPerSecond || 0;
      let finalTimeSpent = typingMetrics?.timeSpent || 0;

      if (code.length > 200 && (finalTimeSpent < 5 || !typingMetrics)) {
        finalHasLargePaste = true;
        finalLargestPasteSize = code.length;
        finalTypingSpeed = 999;
        finalTimeSpent = Math.max(1, finalTimeSpent);
      } else if (finalHasLargePaste && finalTypingSpeed < 25) {
        finalTypingSpeed = 999;
      }

      // Submit to challenge endpoint (which will handle coding submission internally)
      const { data } = await api.post(`/challenges/${challengeId}/submit`, {
        sourceCode: code,
        stdin: stdin,
        typingSpeed: finalTypingSpeed,
        timeSpent: finalTimeSpent,
        hasLargePaste: finalHasLargePaste,
        largestPasteSize: finalLargestPasteSize
      });
      
      return data;
    },
    onSuccess: () => {
      // Navigate back to challenges page after a delay
      setTimeout(() => {
        navigate('/challenges');
      }, 3000);
    }
  });

  const handleSubmit = () => {
    if (isTimeUp) {
      alert('Time is up! You cannot submit after the timer expires.');
      return;
    }
    submitChallenge.mutate();
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-400">Loading challenge...</div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-400">Challenge not found</div>
      </div>
    );
  }

  const opponent = challenge.challenger;
  const language = challenge.codingExercise.language.toLowerCase() as 'python' | 'c' | 'cpp';
  const timeLimit = getTimeLimit(challenge.codingExercise.difficulty);
  const timePercent = (timeRemaining / timeLimit) * 100;

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Minimal Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/challenges')}
            className="p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">Challenge Battle</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <img
              src={opponent?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${opponent?.firstName} ${opponent?.lastName}`)}&background=ef4444&color=fff&size=32`}
              alt={opponent?.firstName}
              className="w-6 h-6 rounded-full border border-red-500/50"
            />
            <span className="text-xs text-zinc-300">
              vs {opponent?.firstName} {opponent?.lastName}
            </span>
          </div>
          {challenge.codingExercise.category && (
            <>
              <div className="h-4 w-px bg-white/10" />
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {challenge.codingExercise.category}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${
            isTimeUp 
              ? 'border-red-500/30 bg-red-500/10' 
              : timeRemaining < 30
              ? 'border-amber-500/30 bg-amber-500/10'
              : 'border-blue-500/30 bg-blue-500/10'
          }`}>
            <Clock className={`h-4 w-4 ${
              isTimeUp ? 'text-red-400' : timeRemaining < 30 ? 'text-amber-400' : 'text-blue-400'
            }`} />
            <span className={`text-sm font-mono font-semibold ${
              isTimeUp ? 'text-red-400' : timeRemaining < 30 ? 'text-amber-400' : 'text-blue-400'
            }`}>
              {formatTime(timeRemaining)}
            </span>
          </div>

          {/* Run Button */}
          <button
            onClick={() => runCode.mutate()}
            disabled={runCode.isPending || isTimeUp}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-sm hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
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

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitChallenge.isPending || isTimeUp || !code.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-sm hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/30"
          >
            {submitChallenge.isPending ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Submit</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content - Split Screen Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Problem Description (40%) */}
        <div className="w-[40%] flex flex-col border-r border-white/5 bg-zinc-900/30">
          {challenge.codingExercise ? (
            <>
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <h1 className="text-2xl font-bold text-white mb-4">{challenge.codingExercise.title}</h1>
                
                <div className="prose prose-invert max-w-none mb-6">
                  <p className="text-zinc-300 leading-relaxed text-sm mb-4 whitespace-pre-wrap">
                    {challenge.codingExercise.prompt}
                  </p>
                </div>

                {/* Info Section */}
                <div className="space-y-4 mt-6 p-4 rounded-md bg-zinc-950/50 border border-white/5">
                  <div>
                    <span className="text-xs text-zinc-500 uppercase tracking-wide">Difficulty</span>
                    <div className="mt-1">
                      <span className={`text-sm font-semibold ${getDifficultyColor(challenge.codingExercise.difficulty)}`}>
                        {challenge.codingExercise.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-xs text-zinc-500 uppercase tracking-wide">Time Limit</span>
                    <div className="mt-1 text-white font-semibold text-sm">{formatTime(timeLimit)}</div>
                  </div>

                  {challenge.challengerScore !== undefined && (
                    <div>
                      <span className="text-xs text-zinc-500 uppercase tracking-wide">Opponent Score</span>
                      <div className="mt-1 text-white font-semibold text-sm">{challenge.challengerScore} / 100</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Info Bar */}
              <div className="h-12 flex items-center justify-between px-6 border-t border-white/5 bg-zinc-900/50">
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="font-mono">{challenge.codingExercise.language}</span>
                  <span className="h-3 w-px bg-white/10" />
                  <span className={`font-medium ${getDifficultyColor(challenge.codingExercise.difficulty)}`}>
                    {challenge.codingExercise.difficulty}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileCode className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">No exercise available</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Code Editor (60%) */}
        <div className="flex-1 flex flex-col bg-zinc-950">
          {challenge.codingExercise ? (
            <>
              {/* Tab Bar */}
              <div className="h-10 flex items-center justify-between px-4 border-b border-white/5 bg-zinc-900/30">
                <div className="flex items-center gap-2">
                  <FileCode className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-xs font-mono text-zinc-400">
                    solution.{language === 'python' ? 'py' : language === 'c' ? 'c' : 'cpp'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                    className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    title={isEditorExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isEditorExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  language={language}
                  value={code}
                  onChange={handleCodeChange}
                  onTypingMetrics={setTypingMetrics}
                />
              </div>

              {/* Terminal/Output Panel (Collapsible) */}
              {showTerminal && runCode.data && (
                <div className="border-t border-white/5 bg-zinc-900/50">
                  <button
                    onClick={() => setShowTerminal(!showTerminal)}
                    className="w-full h-10 flex items-center justify-between px-4 hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-zinc-400" />
                      <span className="text-xs font-semibold text-zinc-300 uppercase">Output</span>
                      {runCode.data.score !== undefined && (
                        <span className={`text-xs font-bold ${
                          runCode.data.score === 100 ? 'text-green-400' :
                          runCode.data.score > 0 ? 'text-amber-400' :
                          'text-red-400'
                        }`}>
                          {runCode.data.score}%
                        </span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  </button>
                  
                  <div className="max-h-64 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {/* Score */}
                    {runCode.data.score !== undefined && (
                      <div className="flex items-center justify-between p-3 rounded-md bg-zinc-950 border border-white/5">
                        <span className="text-sm font-semibold text-zinc-300">Score</span>
                        <span className={`text-lg font-bold ${
                          runCode.data.score === 100 ? 'text-green-400' :
                          runCode.data.score > 0 ? 'text-amber-400' :
                          'text-red-400'
                        }`}>
                          {runCode.data.score}%
                        </span>
                      </div>
                    )}

                    {/* Output */}
                    {runCode.data.stdout && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span className="text-xs font-semibold text-green-400 uppercase">Output</span>
                        </div>
                        <pre className="text-xs text-zinc-200 font-mono whitespace-pre-wrap break-words bg-zinc-950 p-3 rounded-md border border-white/5">
                          {runCode.data.stdout}
                        </pre>
                      </div>
                    )}

                    {/* Errors */}
                    {runCode.data.stderr && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="h-4 w-4 text-red-400" />
                          <span className="text-xs font-semibold text-red-400 uppercase">Errors</span>
                        </div>
                        <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap break-words bg-zinc-950 p-3 rounded-md border border-red-500/20">
                          {runCode.data.stderr}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileCode className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                <p className="text-sm text-zinc-400">No exercise available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {submitChallenge.isSuccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-2xl border border-green-500/50 p-8 max-w-md text-center animate-scale-in">
            <div className="mb-4 flex justify-center">
              <div className="p-4 rounded-full bg-green-500/20">
                <Trophy className="h-12 w-12 text-green-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Challenge Submitted!</h3>
            <p className="text-zinc-400 mb-6">
              Your solution has been submitted. Check the results on the challenges page.
            </p>
            <button
              onClick={() => navigate('/challenges')}
              className="px-6 py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
            >
              Go to Challenges
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeSolvePage;
