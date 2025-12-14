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
  AlertTriangle,
  Trophy,
  User,
  Zap
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading challenge...</div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Challenge not found</div>
      </div>
    );
  }

  const opponent = challenge.challenger;
  const language = challenge.codingExercise.language.toLowerCase() as 'python' | 'c' | 'cpp';
  const timeLimit = getTimeLimit(challenge.codingExercise.difficulty);
  const timePercent = (timeRemaining / timeLimit) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Timer */}
      <div className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/challenges')}
                className="p-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Challenge Battle</h1>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-2">
                    <img
                      src={opponent?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${opponent?.firstName} ${opponent?.lastName}`)}&background=ef4444&color=fff&size=32`}
                      alt={opponent?.firstName}
                      className="w-8 h-8 rounded-full border-2 border-red-500/50"
                    />
                    <span className="text-sm text-slate-300">
                      vs {opponent?.firstName} {opponent?.lastName}
                    </span>
                  </div>
                  {challenge.codingExercise.category && (
                    <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                      {challenge.codingExercise.category}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-4">
              <div className={`relative px-6 py-3 rounded-xl border-2 ${
                isTimeUp 
                  ? 'border-red-500 bg-red-500/10' 
                  : timeRemaining < 30
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : 'border-primary bg-primary/10'
              }`}>
                <div className="flex items-center gap-3">
                  <Clock className={`h-6 w-6 ${
                    isTimeUp ? 'text-red-400' : timeRemaining < 30 ? 'text-yellow-400' : 'text-primary'
                  }`} />
                  <div>
                    <div className={`text-2xl font-bold ${
                      isTimeUp ? 'text-red-400' : timeRemaining < 30 ? 'text-yellow-400' : 'text-primary'
                    }`}>
                      {formatTime(timeRemaining)}
                    </div>
                    {!hasStarted && (
                      <div className="text-xs text-slate-400">Click to start</div>
                    )}
                  </div>
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 rounded-b-xl overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      isTimeUp 
                        ? 'bg-red-500' 
                        : timeRemaining < 30
                        ? 'bg-yellow-500'
                        : 'bg-primary'
                    }`}
                    style={{ width: `${timePercent}%` }}
                  />
                </div>
              </div>

              {isTimeUp && (
                <div className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50">
                  <span className="text-red-400 font-semibold text-sm">Time's Up!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Problem Description */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-white">{challenge.codingExercise.title}</h2>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wide">Difficulty</span>
                  <div className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      challenge.codingExercise.difficulty === 'Beginner' || challenge.codingExercise.difficulty === 'Easy'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : challenge.codingExercise.difficulty === 'Intermediate' || challenge.codingExercise.difficulty === 'Medium'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {challenge.codingExercise.difficulty}
                    </span>
                  </div>
                </div>
                
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wide">Time Limit</span>
                  <div className="mt-1 text-white font-semibold">{formatTime(timeLimit)}</div>
                </div>

                {challenge.challengerScore !== undefined && (
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Opponent Score</span>
                    <div className="mt-1 text-white font-semibold">{challenge.challengerScore} / 100</div>
                  </div>
                )}
              </div>

              <div className="prose prose-invert max-w-none">
                <div className="text-sm text-slate-300 whitespace-pre-wrap">
                  {challenge.codingExercise.prompt}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => runCode.mutate()}
                  disabled={runCode.isPending || isTimeUp}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-500/20 border border-blue-500/50 px-4 py-3 text-blue-300 font-semibold hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="h-5 w-5" />
                  {runCode.isPending ? 'Running...' : 'Run Code'}
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitChallenge.isPending || isTimeUp || !code.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 text-white font-bold hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitChallenge.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Submit Solution
                    </>
                  )}
                </button>
              </div>

              {/* Run Result */}
              {runCode.data && (
                <div className={`mt-4 p-4 rounded-lg ${
                  runCode.data.success 
                    ? 'bg-emerald-500/10 border border-emerald-500/30' 
                    : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {runCode.data.success ? (
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                    <span className={`font-semibold ${
                      runCode.data.success ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {runCode.data.success ? 'Success!' : 'Error'}
                    </span>
                  </div>
                  {runCode.data.stdout && (
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap mt-2">
                      {runCode.data.stdout}
                    </pre>
                  )}
                  {runCode.data.stderr && (
                    <pre className="text-xs text-red-400 whitespace-pre-wrap mt-2">
                      {runCode.data.stderr}
                    </pre>
                  )}
                  {runCode.data.score !== undefined && (
                    <div className="mt-2 text-sm text-slate-300">
                      Score: <span className="font-bold text-white">{runCode.data.score} / 100</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Code Editor */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 overflow-hidden">
              <div className="border-b border-slate-700 bg-slate-800/50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-white">Code Editor</span>
                  <span className="px-2 py-1 rounded bg-slate-700 text-xs text-slate-300">
                    {language.toUpperCase()}
                  </span>
                </div>
                {hasStarted && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="h-4 w-4" />
                    <span>Started {Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000)}s ago</span>
                  </div>
                )}
              </div>
              
              <div className="h-[600px]">
                <CodeEditor
                  language={language}
                  value={code}
                  onChange={handleCodeChange}
                  onTypingMetrics={setTypingMetrics}
                />
              </div>
            </div>

            {/* Input Section */}
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/80 p-4">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Standard Input (stdin)
              </label>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Enter input here..."
                className="w-full h-24 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white font-mono resize-none focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {submitChallenge.isSuccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-2xl border border-emerald-500/50 p-8 max-w-md text-center animate-scale-in">
            <div className="mb-4 flex justify-center">
              <div className="p-4 rounded-full bg-emerald-500/20">
                <Trophy className="h-12 w-12 text-emerald-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Challenge Submitted!</h3>
            <p className="text-slate-400 mb-6">
              Your solution has been submitted. Check the results on the challenges page.
            </p>
            <button
              onClick={() => navigate('/challenges')}
              className="px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
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

