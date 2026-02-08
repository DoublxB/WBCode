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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
      {/* Animated background particles - VERDE pentru success */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-green-500/20 rounded-full blur-3xl animate-float" />
      </div>
      
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border-2 border-green-500/60 p-12 max-w-lg text-center animate-level-up shadow-2xl overflow-hidden">
        {/* Shine effect - VERDE */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent -translate-x-full animate-shine pointer-events-none" />
        
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            {/* Outer glow rings - VERDE */}
            <div className="absolute inset-0 bg-green-500/30 rounded-full blur-3xl animate-pulse-slow scale-150" />
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse-slow scale-125" style={{ animationDelay: '0.5s' }} />
            
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 flex items-center justify-center border-4 border-green-400 shadow-2xl animate-float animate-glow-green">
              <CheckCircle className="h-16 w-16 text-white drop-shadow-2xl" />
            </div>
            
            {/* Rotating checkmarks - VERDE */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-50px)`,
                }}
              >
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Score Display */}
        <div className="mb-6">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 mb-3 animate-gradient-shift drop-shadow-lg" 
              style={{ backgroundSize: '200% 200%' }}>
            {isPerfect ? '🎯 Perfect Score! 🎯' : '🎉 Great Job! 🎉'}
          </h2>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-6xl font-extrabold text-green-400 drop-shadow-2xl animate-float">{score}</span>
            <span className="text-3xl text-slate-400">/</span>
            <span className="text-4xl font-bold text-slate-300">{maxScore}</span>
          </div>
          <div className="w-full h-4 bg-slate-800/50 rounded-full overflow-hidden border-2 border-slate-700/50 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-400 transition-all duration-1000 relative overflow-hidden"
              style={{ width: `${percentage}%` }}
            >
              {/* Shine effect on progress bar - VERDE */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
            </div>
          </div>
          <p className="text-base text-slate-300 mt-3 font-semibold">{percentage}% correct</p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {xpGained && (
            <div className="group relative rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 border-2 border-green-400/40 hover:border-green-400/60 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-center gap-2 mb-1">
                <Trophy className="h-6 w-6 text-green-400 drop-shadow-lg" />
                <span className="text-xs text-slate-300 uppercase font-semibold">XP Gained</span>
              </div>
              <p className="text-3xl font-extrabold text-green-400 drop-shadow-lg">+{xpGained}</p>
            </div>
          )}
          {timeTaken && (
            <div className="group relative rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-4 border-2 border-blue-400/40 hover:border-blue-400/60 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-center gap-2 mb-1">
                <Clock className="h-6 w-6 text-blue-400 drop-shadow-lg" />
                <span className="text-xs text-slate-300 uppercase font-semibold">Time</span>
              </div>
              <p className="text-3xl font-extrabold text-blue-400 drop-shadow-lg">{timeTaken}</p>
            </div>
          )}
        </div>
        
        {/* Continue Button - ALBASTRU */}
        <button
          onClick={handleContinue}
          className="group relative w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 px-6 py-4 text-white font-bold hover:from-blue-600 hover:via-blue-700 hover:to-blue-600 transition-all shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 overflow-hidden"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <span className="relative z-10">{continueLabel}</span>
          <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default SuccessScreen;




