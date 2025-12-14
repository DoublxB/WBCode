import { XCircle, RefreshCw, BookOpen, AlertCircle } from 'lucide-react';

interface FailureScreenProps {
  score: number;
  maxScore: number;
  errors?: string[];
  explanation?: string;
  onTryAgain?: () => void;
  onViewSolution?: () => void;
  showSolution?: boolean;
}

const FailureScreen = ({
  score,
  maxScore,
  errors,
  explanation,
  onTryAgain,
  onViewSolution,
  showSolution = false
}: FailureScreenProps) => {
  const percentage = Math.round((score / maxScore) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-slate-900 rounded-3xl border-2 border-error-500/50 p-12 max-w-lg text-center animate-level-up shadow-2xl">
        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-error-500/20 rounded-full blur-2xl animate-pulse-slow" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-error-500 to-error-600 flex items-center justify-center border-4 border-error-400 shadow-lg">
              <XCircle className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>

        {/* Score Display */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            Keep Practicing!
          </h2>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-5xl font-bold text-error-400">{score}</span>
            <span className="text-2xl text-slate-400">/</span>
            <span className="text-3xl font-semibold text-slate-300">{maxScore}</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-error-500 to-error-400 transition-all duration-1000"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-sm text-slate-400 mt-2">{percentage}% correct</p>
        </div>

        {/* Errors */}
        {errors && errors.length > 0 && (
          <div className="mb-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-error-400" />
              <h3 className="text-lg font-semibold text-white">What went wrong:</h3>
            </div>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div key={index} className="rounded-lg bg-error-500/10 border border-error-500/30 p-3">
                  <p className="text-sm text-error-300">{error}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explanation */}
        {explanation && (
          <div className="mb-6 rounded-xl bg-slate-800/50 p-4 border border-slate-700/50 text-left">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-primary-400" />
              <h3 className="text-sm font-semibold text-white">Explanation</h3>
            </div>
            <p className="text-sm text-slate-300">{explanation}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onTryAgain && (
            <button
              onClick={onTryAgain}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-4 text-white font-bold hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg hover:shadow-primary-500/50"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Try Again</span>
            </button>
          )}
          {onViewSolution && showSolution && (
            <button
              onClick={onViewSolution}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-slate-700 bg-slate-800/50 px-6 py-4 text-slate-300 font-semibold hover:bg-slate-800 hover:text-white transition-all"
            >
              <BookOpen className="h-5 w-5" />
              <span>View Solution</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FailureScreen;

