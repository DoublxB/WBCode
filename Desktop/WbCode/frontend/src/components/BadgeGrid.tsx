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
        return 'from-yellow-500 via-orange-500 to-pink-500 border-yellow-400/50';
      case 'EPIC':
        return 'from-purple-500 to-pink-500 border-purple-400/50';
      case 'RARE':
        return 'from-blue-500 to-cyan-500 border-blue-400/50';
      default:
        return 'from-slate-500 to-slate-600 border-slate-400/50';
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
            className={`relative rounded-xl border-2 p-6 transition-all ${
              unlocked
                ? `bg-gradient-to-br ${rarityColor} cursor-pointer hover:scale-105 hover:shadow-xl`
                : 'bg-slate-800/50 border-slate-700/50 opacity-60'
            }`}
          >
            {!unlocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-xl backdrop-blur-sm z-10">
                <div className="text-center">
                  <Lock className="h-12 w-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">Locked</p>
                </div>
              </div>
            )}

            <div className="relative z-0">
              <div className="flex items-start gap-4 mb-3">
                <div className={`p-3 rounded-lg ${
                  unlocked
                    ? 'bg-white/20'
                    : 'bg-slate-700/50'
                }`}>
                  {badge.icon ? (
                    <span className="text-3xl">{badge.icon}</span>
                  ) : (
                    <Award className={`h-8 w-8 ${unlocked ? 'text-white' : 'text-slate-500'}`} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-lg mb-1 ${
                    unlocked ? 'text-white' : 'text-slate-400'
                  }`}>
                    {badge.name}
                  </h3>
                  {badge.rarity && unlocked && (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      badge.rarity === 'LEGENDARY' ? 'bg-yellow-500/20 text-yellow-300' :
                      badge.rarity === 'EPIC' ? 'bg-purple-500/20 text-purple-300' :
                      badge.rarity === 'RARE' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-slate-500/20 text-slate-300'
                    }`}>
                      {badge.rarity}
                    </span>
                  )}
                </div>
              </div>

              <p className={`text-sm ${
                unlocked ? 'text-white/90' : 'text-slate-500'
              }`}>
                {badge.description}
              </p>

              {unlocked && badge.unlockedAt && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-xs text-white/70">
                    Unlocked: {new Date(badge.unlockedAt).toLocaleDateString()}
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

