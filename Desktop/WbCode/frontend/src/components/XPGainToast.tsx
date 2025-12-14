import { useEffect, useState } from 'react';
import { Zap, Sparkles } from 'lucide-react';

interface XPGainToastProps {
  amount: number;
  reason?: string;
  onComplete?: () => void;
}

const XPGainToast = ({ amount, reason, onComplete }: XPGainToastProps) => {
  const [show, setShow] = useState(true);
  const [animatedAmount, setAnimatedAmount] = useState(0);

  useEffect(() => {
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
      setTimeout(() => onComplete?.(), 300);
    }, duration + 500);

    return () => {
      clearInterval(timer);
      clearTimeout(hideTimer);
    };
  }, [amount, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed top-20 right-8 z-50 animate-slide-in">
      <div className="relative bg-gradient-to-br from-success-500/90 to-success-600/90 backdrop-blur-sm rounded-xl border-2 border-success-400/50 px-6 py-4 shadow-2xl shadow-success-500/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-success-400/50 rounded-full blur-lg animate-pulse" />
            <div className="relative bg-white/20 rounded-full p-2">
              <Zap className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                +{animatedAmount}
              </span>
              <span className="text-sm font-semibold text-success-100">XP</span>
            </div>
            {reason && (
              <p className="text-xs text-success-100 mt-0.5">{reason}</p>
            )}
          </div>
          <Sparkles className="h-5 w-5 text-white/80 animate-pulse" />
        </div>
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-success-400/30 rounded-b-xl overflow-hidden">
          <div
            className="h-full bg-white/50 animate-xp-progress"
            style={{
              animation: 'xp-progress 1.5s ease-out forwards'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default XPGainToast;

