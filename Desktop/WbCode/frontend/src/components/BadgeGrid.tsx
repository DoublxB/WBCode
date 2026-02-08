import { Lock, Award } from 'lucide-react';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon?: string;
  rarity?: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  unlockedAt?: string;
}

interface BadgeGridProps {
  badges: Badge[];
  unlockedBadgeIds?: number[];
}

const BadgeGrid = ({ badges, unlockedBadgeIds = [] }: BadgeGridProps) => {
  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'LEGENDARY':
        // PORTOCALIU pentru recompensă maximă
        return 'from-amber-500 via-orange-500 to-amber-500 border-amber-400/50';
      case 'EPIC':
        // PORTOCALIU pentru recompensă mare
        return 'from-orange-500 to-amber-500 border-orange-400/50';
      case 'RARE':
        // VERDE pentru progres bun
        return 'from-green-500 to-emerald-500 border-green-400/50';
      default:
        // ALBASTRU pentru common (bază)
        return 'from-blue-500 to-blue-600 border-blue-400/50';
    }
  };

  const isUnlocked = (badgeId: number) => unlockedBadgeIds.includes(badgeId);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {badges.map((badge) => {
        const unlocked = isUnlocked(badge.id);
        const rarityColor = getRarityColor(badge.rarity);

        return (
          <div
            key={badge.id}
            className={`group relative rounded-xl border-2 p-6 transition-all duration-300 overflow-hidden ${
              unlocked
                ? `bg-gradient-to-br ${rarityColor} cursor-pointer hover:scale-105 hover:shadow-2xl`
                : 'bg-slate-800/50 border-slate-700/50 opacity-60'
            }`}
          >
            {/* Shine effect for unlocked badges */}
            {unlocked && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
            )}
            
            {!unlocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 rounded-xl backdrop-blur-sm z-10">
                <div className="text-center">
                  <Lock className="h-12 w-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">Locked</p>
                </div>
              </div>
            )}

            <div className="relative z-0">
              <div className="flex items-start gap-4 mb-3">
                <div className={`p-3 rounded-lg transition-transform duration-300 ${
                  unlocked
                    ? 'bg-white/20 group-hover:scale-110 group-hover:rotate-12'
                    : 'bg-slate-700/50'
                }`}>
                  {badge.icon ? (
                    <span className="text-3xl drop-shadow-lg">{badge.icon}</span>
                  ) : (
                    <Award className={`h-8 w-8 ${unlocked ? 'text-white drop-shadow-lg' : 'text-slate-500'}`} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-lg mb-1 transition-colors ${
                    unlocked ? 'text-white drop-shadow-lg' : 'text-slate-400'
                  }`}>
                    {badge.name}
                  </h3>
                  {badge.rarity && unlocked && (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                      badge.rarity === 'LEGENDARY' ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50' :
                      badge.rarity === 'EPIC' ? 'bg-orange-500/30 text-orange-200 border border-orange-400/50' :
                      badge.rarity === 'RARE' ? 'bg-green-500/30 text-green-200 border border-green-400/50' :
                      'bg-blue-500/30 text-blue-200 border border-blue-400/50'
                    }`}>
                      {badge.rarity}
                    </span>
                  )}
                </div>
              </div>

              <p className={`text-sm transition-colors ${
                unlocked ? 'text-white/90' : 'text-slate-500'
              }`}>
                {badge.description}
              </p>

              {unlocked && badge.unlockedAt && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-xs text-white/80 font-medium">
                    ✨ Unlocked: {new Date(badge.unlockedAt).toLocaleDateString()} ✨
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BadgeGrid;




