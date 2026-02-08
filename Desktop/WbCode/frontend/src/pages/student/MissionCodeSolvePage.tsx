import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useMissions } from '../../api/hooks';
import CodeEditor from '../../components/CodeEditor';
import {
  Target,
  Clock,
  Play,
  CheckCircle,
  XCircle,
  Trophy,
  ArrowLeft,
  FileCode,
  Terminal,
  ChevronDown,
  Maximize2,
  Minimize2
} from 'lucide-react';

type CodingExercise = {
  id: number;
  title: string;
  prompt: string;
  starterCode: string;
  difficulty: string;
  language: 'C' | 'CPP' | 'PYTHON';
};

const getTimeLimit = (difficulty: string): number => {
  switch (difficulty.toLowerCase()) {
    case 'beginner':
    case 'easy':
      return 2 * 60;
    case 'intermediate':
    case 'medium':
      return 5 * 60;
    case 'advanced':
    case 'hard':
      return 10 * 60;
    default:
      return 3 * 60;
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

const MissionCodeSolvePage = () => {
  const { id } = useParams<{ id: string }>();
  const missionId = id ? parseInt(id, 10) : NaN;
  const navigate = useNavigate();

  const { data: missions } = useMissions();
  const mission = Array.isArray(missions)
    ? missions.find((m: any) => m.id === missionId)
    : null;

  const codingExerciseId = mission?.codingExerciseId as number | undefined;

  const [code, setCode] = useState('');
  const [stdin, setStdin] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: exercise, isLoading } = useQuery<CodingExercise | null>({
    queryKey: ['mission-coding', codingExerciseId],
    queryFn: async () => {
      if (!codingExerciseId) return null;
      const { data } = await api.get(`/coding/${codingExerciseId}`);
      return data as CodingExercise;
    },
    enabled: !!codingExerciseId
  });

  // Initialize timer and starter code when we have the exercise
  useEffect(() => {
    if (exercise && !hasStarted) {
      const limit = getTimeLimit(exercise.difficulty);
      setTimeRemaining(limit);
      setCode(exercise.starterCode || '');
    }
  }, [exercise, hasStarted]);

  // Timer effect
  useEffect(() => {
    if (hasStarted && timeRemaining > 0 && !isTimeUp) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
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
  }, [hasStarted, isTimeUp, timeRemaining]);

  const handleCodeChange = (value: string) => {
    if (!hasStarted && exercise && value !== exercise.starterCode) {
      setHasStarted(true);
    }
    setCode(value);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const runCode = useMutation({
    mutationFn: async () => {
      if (!exercise) return null;
      const { data } = await api.post(`/coding/${exercise.id}/submit`, {
        sourceCode: code,
        stdin
      });
      setShowTerminal(true);
      return data;
    }
  });

  const claimReward = useMutation({
    mutationFn: async () => {
      if (!missionId || Number.isNaN(missionId)) return null;
      const { data } = await api.post(`/missions/${missionId}/claim`);
      return data;
    }
  });

  const submitSolution = useMutation({
    mutationFn: async () => {
      if (!exercise) return null;
      if (isTimeUp) {
        alert('Time is up! You cannot submit after the timer expires.');
        return null;
      }

      const { data } = await api.post(`/coding/${exercise.id}/submit`, {
        sourceCode: code,
        stdin
      });
      return data;
    },
    onSuccess: () => {
      // CodingService.submit will automatically advance related missions.
      setTimeout(() => {
        navigate('/missions');
      }, 2500);
    }
  });

  if (Number.isNaN(missionId)) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-400">Invalid mission</div>
      </div>
    );
  }

  if (isLoading || !exercise || !mission) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-400">Loading mission exercise...</div>
      </div>
    );
  }

  const language = exercise.language.toLowerCase() as 'python' | 'c' | 'cpp';
  const timeLimit = getTimeLimit(exercise.difficulty);
  const timePercent = (timeRemaining / timeLimit) * 100;

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Minimal Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/missions')}
            className="p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <Target className="h-4 w-4 text-amber-400" />
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Weekly Mission</p>
              <span className="text-sm font-semibold text-white">{mission.title}</span>
            </div>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span>+{mission.rewardXP} XP</span>
          </div>
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
            onClick={() => submitSolution.mutate()}
            disabled={submitSolution.isPending || isTimeUp || !code.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-sm hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/30"
          >
            {submitSolution.isPending ? (
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
          {exercise ? (
            <>
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <h1 className="text-2xl font-bold text-white mb-4">{exercise.title}</h1>
                
                <div className="prose prose-invert max-w-none mb-6">
                  <p className="text-zinc-300 leading-relaxed text-sm mb-4 whitespace-pre-wrap">
                    {exercise.prompt}
                  </p>
                </div>

                {/* Info Section */}
                <div className="space-y-4 mt-6 p-4 rounded-md bg-zinc-950/50 border border-white/5">
                  <div>
                    <span className="text-xs text-zinc-500 uppercase tracking-wide">Difficulty</span>
                    <div className="mt-1">
                      <span className={`text-sm font-semibold ${getDifficultyColor(exercise.difficulty)}`}>
                        {exercise.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-xs text-zinc-500 uppercase tracking-wide">Time Limit</span>
                    <div className="mt-1 text-white font-semibold text-sm">{formatTime(timeLimit)}</div>
                  </div>
                </div>
              </div>

              {/* Bottom Info Bar */}
              <div className="h-12 flex items-center justify-between px-6 border-t border-white/5 bg-zinc-900/50">
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="font-mono">{exercise.language}</span>
                  <span className="h-3 w-px bg-white/10" />
                  <span className={`font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                    {exercise.difficulty}
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
          {exercise ? (
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
    </div>
  );
};

export default MissionCodeSolvePage;
