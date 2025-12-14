import { CheckCircle, Trophy, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SuccessScreenProps {
  score: number;
  maxScore: number;
  xpGained?: number;
  timeTaken?: string;
  onContinue?: () => void;
  continueLabel?: string;
  continuePath?: string;
}

const SuccessScreen = ({
  score,
  maxScore,
  xpGained,
  timeTaken,
  onContinue,
  continueLabel = 'Continue',
  continuePath
}: SuccessScreenProps) => {
  const navigate = useNavigate();

  const handleContinue = () => {
    if (continuePath) {
      navigate(continuePath);
    } else if (onContinue) {
      onContinue();
    }
  };

  const percentage = Math.round((score / maxScore) * 100);
  const isPerfect = score === maxScore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-slate-900 rounded-3xl border-2 border-success-500/50 p-12 max-w-lg text-center animate-level-up shadow-2xl">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-success-500/20 rounded-full blur-2xl animate-pulse-slow" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center border-4 border-success-400 shadow-lg">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>

        {/* Score Display */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            {isPerfect ? 'Perfect Score!' : 'Great Job!'}
          </h2>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-5xl font-bold text-success-400">{score}</span>
            <span className="text-2xl text-slate-400">/</span>
            <span className="text-3xl font-semibold text-slate-300">{maxScore}</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-success-500 to-success-400 transition-all duration-1000"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-sm text-slate-400 mt-2">{percentage}% correct</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {xpGained && (
            <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Trophy className="h-5 w-5 text-success-400" />
                <span className="text-xs text-slate-400 uppercase">XP Gained</span>
              </div>
              <p className="text-2xl font-bold text-success-400">+{xpGained}</p>
            </div>
          )}
          {timeTaken && (
            <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="h-5 w-5 text-primary-400" />
                <span className="text-xs text-slate-400 uppercase">Time</span>
              </div>
              <p className="text-2xl font-bold text-primary-400">{timeTaken}</p>
            </div>
          )}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-4 text-white font-bold hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg hover:shadow-primary-500/50 transform hover:scale-105"
        >
          <span>{continueLabel}</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default SuccessScreen;

