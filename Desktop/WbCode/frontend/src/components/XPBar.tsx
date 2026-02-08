import { useProfile } from '../api/hooks';
import { Zap } from 'lucide-react';
import WBCCoin from './WBCCoin';

const XPBar = () => {
  const { data: profile } = useProfile();
  
  if (!profile) return null;
  
  const currentXP = profile.xp || 0;
  const currentLevel = profile.level || 1;
  const xpForNextLevel = currentLevel * 100;
  const xpInCurrentLevel = currentXP % 100;
  const progress = Math.min((xpInCurrentLevel / 100) * 100, 100);
  const xpNeeded = 100 - xpInCurrentLevel;
  const wbcCoins = profile.wbcCoins || 0;
  
  return (
    <div className="flex items-center gap-4">
      {/* WBC Coins */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:from-amber-500/20 hover:to-orange-500/20 transition-all glow-effect">
        <div className="flex-shrink-0">
          <WBCCoin size="sm" animation="none" />
        </div>
        <span className="text-sm font-semibold text-amber-400">{wbcCoins.toLocaleString()}</span>
        <span className="text-xs text-amber-400/70">WBC</span>
      </div>

      {/* XP Bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-success-400" />
          <span className="text-sm font-semibold text-slate-200">
            {currentXP.toLocaleString()} XP
          </span>
        </div>
        <div className="w-32 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-success-500 to-success-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center border-2 border-slate-800 shadow-lg">
            <span className="text-xs font-bold text-white">{currentLevel}</span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            {xpNeeded} to {currentLevel + 1}
          </span>
        </div>
      </div>
    </div>
  );
};

export default XPBar;




