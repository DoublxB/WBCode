import { useEffect, useState } from 'react';
import { X, Trophy, Sparkles } from 'lucide-react';

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

const LevelUpModal = ({ level, onClose }: LevelUpModalProps) => {
  const [show, setShow] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-slate-900 rounded-3xl border-2 border-success-500/50 p-12 max-w-md text-center animate-level-up shadow-2xl">
        <button
          onClick={() => {
            setShow(false);
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-success-500/20 rounded-full blur-2xl animate-pulse-slow" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center border-4 border-success-400 shadow-lg">
              <Trophy className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-2">
          Level {level} Unlocked!
        </h2>
        <p className="text-slate-300 mb-6">
          Congratulations! You've reached a new milestone.
        </p>
        
        <div className="flex items-center justify-center gap-2 text-success-400">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold">Keep up the great work!</span>
        </div>
      </div>
    </div>
  );
};

export default LevelUpModal;

