import { useEffect, useState, useRef } from 'react';
import { Zap, Sparkles } from 'lucide-react';
import XPConfetti from './XPConfetti';

interface XPGainToastProps {
  amount: number;
  reason?: string;
  onComplete?: () => void;
}

const XPGainToast = ({ amount, reason, onComplete }: XPGainToastProps) => {
  const [show, setShow] = useState(true);
  const [animatedAmount, setAnimatedAmount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const onCompleteRef = useRef(onComplete);
  
  // Update ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Run animation only once on mount
  useEffect(() => {
    if (amount <= 0) {
      return;
    }
    
    // Trigger confetti
    setShowConfetti(true);
    
    // Animate number from 0 to amount
    const duration = 1500;
    const steps = 30;
    const increment = amount / steps;
    const stepDuration = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= amount) {
        setAnimatedAmount(amount);
        clearInterval(timer);
      } else {
        setAnimatedAmount(Math.floor(current));
      }
    }, stepDuration);

    // Hide after animation
    const hideTimer = setTimeout(() => {
      setShow(false);
      setShowConfetti(false);
      setTimeout(() => {
        onCompleteRef.current?.();
      }, 300);
    }, duration + 500);

    return () => {
      clearInterval(timer);
      clearTimeout(hideTimer);
    };
  }, []); // Empty deps - run only once on mount

  if (!show) {
    return null;
  }

  return (
    <>
      <XPConfetti trigger={showConfetti} amount={amount} />
      <div className="fixed top-20 right-8 z-[100] animate-slide-in">
        <div className="relative bg-gradient-to-br from-green-500/95 via-emerald-500/95 to-green-500/95 backdrop-blur-md rounded-2xl border-2 border-green-400/60 px-6 py-4 shadow-2xl shadow-green-500/50 animate-glow-green">
          {/* Animated background glow - VERDE pentru XP */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-2xl blur-xl animate-pulse-slow" />
          
          <div className="relative flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400/50 rounded-full blur-2xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-white/30 to-white/10 rounded-full p-3 backdrop-blur-sm">
                <Zap className="h-6 w-6 text-white drop-shadow-lg animate-bounce-slow" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white drop-shadow-lg animate-float">
                  +{animatedAmount}
                </span>
                <span className="text-sm font-bold text-green-100 drop-shadow">XP</span>
              </div>
              {reason && (
                <p className="text-xs text-green-100 mt-0.5 font-medium">{reason}</p>
              )}
            </div>
            <div className="relative">
              <Sparkles className="h-6 w-6 text-amber-300 animate-spin-slow drop-shadow-lg" />
              <div className="absolute inset-0 bg-amber-300/30 rounded-full blur-lg animate-pulse" />
            </div>
          </div>
          
          {/* Animated progress bar - VERDE */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-green-400/30 rounded-b-2xl overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-white via-green-300 to-white animate-xp-progress"
              style={{
                animation: 'xp-progress 1.5s ease-out forwards',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
          
          {/* Shine effect */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shine" />
          </div>
        </div>
      </div>
    </>
  );
};

export default XPGainToast;




