import { useEffect, useState } from 'react';
import { X, Trophy, Sparkles, Star } from 'lucide-react';
import Confetti from './Confetti';

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

const LevelUpModal = ({ level, onClose }: LevelUpModalProps) => {
  const [show, setShow] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setShowConfetti(false);
      setTimeout(onClose, 300);
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  if (!show) return null;
  
  return (
    <>
      {showConfetti && <Confetti count={100} duration={4000} />}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
      {/* Animated background particles - PORTOCALIU pentru recompensă */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl animate-float" />
      </div>
      
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border-2 border-amber-500/60 p-12 max-w-md text-center animate-level-up shadow-2xl overflow-hidden">
        {/* Shine effect - PORTOCALIU */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full animate-shine pointer-events-none" />
          
          <button
            onClick={() => {
              setShow(false);
              setShowConfetti(false);
              onClose();
            }}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800/50 z-10"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="mb-6 flex justify-center">
            <div className="relative">
              {/* Outer glow rings - PORTOCALIU pentru recompensă */}
              <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-3xl animate-pulse-slow scale-150" />
              <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-2xl animate-pulse-slow scale-125" style={{ animationDelay: '0.5s' }} />
              
              {/* Trophy icon with animation - PORTOCALIU */}
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center border-4 border-amber-400 shadow-2xl animate-float animate-glow-amber">
                <Trophy className="h-16 w-16 text-white drop-shadow-2xl animate-bounce-slow" />
              </div>
              
              {/* Rotating stars - PORTOCALIU/GALBEN */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-60px)`,
                  }}
                >
                  <Star 
                    className="h-4 w-4 text-amber-400 fill-amber-400 animate-spin-slow" 
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                </div>
              ))}
            </div>
          </div>
          
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 mb-3 animate-gradient-shift drop-shadow-lg" 
              style={{ backgroundSize: '200% 200%' }}>
            Level {level} Unlocked!
          </h2>
          <p className="text-slate-300 mb-6 text-lg">
            🎉 Congratulations! You've reached a new milestone. 🎉
          </p>
          
          <div className="flex items-center justify-center gap-3 text-amber-400 mb-4">
            <Sparkles className="h-6 w-6 animate-pulse" />
            <span className="font-bold text-lg">Keep up the great work!</span>
            <Sparkles className="h-6 w-6 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
          
          {/* Level badge - PORTOCALIU */}
          <div className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-2 border-amber-400/50">
            <Star className="h-5 w-5 text-amber-400 fill-amber-400 animate-spin-slow" />
            <span className="text-2xl font-bold text-white">Level {level}</span>
            <Star className="h-5 w-5 text-amber-400 fill-amber-400 animate-spin-slow" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>
      </div>
    </>
  );
};

export default LevelUpModal;




