import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Sparkles } from 'lucide-react';
import { api } from '../../api/client';
import { useCosmetics, useMyCosmetics, useProfile } from '../../api/hooks';
import WBCCoin from '../../components/WBCCoin';

type CosmeticType = 'AVATAR_FRAME' | 'PROFILE_BANNER' | 'PROFILE_THEME' | 'TITLE';

const typeLabels: Record<CosmeticType, string> = {
  PROFILE_BANNER: 'Bannere',
  AVATAR_FRAME: 'Rame Avatar',
  PROFILE_THEME: 'Teme (Accent)',
  TITLE: 'Titluri'
};

const CosmeticShopPage = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: cosmeticsCatalog = [] } = useCosmetics();
  const { data: myCosmetics } = useMyCosmetics();

  const [activeType, setActiveType] = useState<CosmeticType>('PROFILE_BANNER');

  const ownedCodes = useMemo(
    () => new Set<string>((myCosmetics?.owned || []).map((c: any) => c.code).filter(Boolean)),
    [myCosmetics?.owned]
  );
  const equippedMap: Record<string, string | null> = (myCosmetics?.equipped || {}) as any;

  const purchaseCosmetic = useMutation({
    mutationFn: async (code: string) => {
      const { data } = await api.post(`/cosmetics/purchase/${code}`);
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cosmetics', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] })
      ]);
    }
  });

  const equipCosmetic = useMutation({
    mutationFn: async (payload: { type: CosmeticType; code: string | null }) => {
      const { data } = await api.post('/cosmetics/equip', payload);
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cosmetics', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] })
      ]);
    }
  });

  const items = cosmeticsCatalog.filter((c: any) => c.type === activeType);
  const equippedCode = equippedMap[activeType] ?? null;
  const balance = profile?.wbcCoins ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8 shadow-2xl">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.25),transparent_40%),radial-gradient(circle_at_70%_40%,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_40%_80%,rgba(236,72,153,0.16),transparent_45%)]" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10">
              <Gift className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white">Shop</h1>
              <p className="text-sm text-slate-300">Cumpără și echipează iteme pentru profil folosind WBC Coins.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3">
            <WBCCoin size="sm" animation="none" />
            <div className="text-right">
              <p className="text-xs text-slate-400">Sold</p>
              <p className="text-lg font-extrabold text-amber-300">{balance}</p>
            </div>
            <span className="text-xs text-slate-400">WBC</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(typeLabels) as CosmeticType[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={`btn-press rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
              activeType === t
                ? 'border-blue-500/40 bg-blue-500/15 text-blue-200'
                : 'border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-900/45'
            }`}
          >
            {typeLabels[t]}
          </button>
        ))}

        {equippedCode && (
          <button
            onClick={() => equipCosmetic.mutate({ type: activeType, code: null })}
            disabled={equipCosmetic.isPending}
            className="btn-press ml-auto rounded-xl border border-slate-800 bg-slate-950/30 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-950/45 disabled:opacity-50"
            title="Scoate cosmetic-ul echipat pentru această categorie"
          >
            Unequip
          </button>
        )}
      </div>

      {/* Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((c: any, idx: number) => {
          const owned = c.priceCoins === 0 || ownedCodes.has(c.code);
          const equipped = equippedCode === c.code;
          const canBuy = !owned && balance >= (c.priceCoins ?? 0);

          const previewStyle =
            c.type === 'PROFILE_BANNER'
              ? { backgroundImage: `linear-gradient(135deg, ${(c.metadata?.colors || []).join(', ')})` }
              : c.type === 'AVATAR_FRAME'
              ? { backgroundImage: `linear-gradient(135deg, ${(c.metadata?.border || []).join(', ')})` }
              : c.type === 'PROFILE_THEME'
              ? { backgroundColor: c.metadata?.accent || '#60a5fa' }
              : undefined;

          return (
            <div
              key={c.code}
              className="item-enter group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 p-5 shadow-lg shadow-black/20"
              style={{ animationDelay: `${Math.min(idx * 50, 250)}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-extrabold text-white truncate">{c.name}</p>
                  <p className="mt-1 text-sm text-slate-300">{c.description}</p>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[11px] rounded-full border border-slate-700/50 bg-slate-950/30 px-2 py-1 text-slate-300">
                      {c.rarity || 'COMMON'}
                    </span>
                    {owned ? (
                      <span className="text-[11px] rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">
                        Owned
                      </span>
                    ) : (
                      <span className="text-[11px] rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-300">
                        {c.priceCoins} WBC
                      </span>
                    )}
                    {equipped && (
                      <span className="text-[11px] rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-blue-200">
                        Equipped
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {c.type === 'PROFILE_BANNER' && (
                    <div className="h-14 w-24 rounded-xl border border-white/10" style={previewStyle} />
                  )}
                  {c.type === 'AVATAR_FRAME' && (
                    <div className="h-14 w-14 rounded-full p-1" style={previewStyle}>
                      <div className="h-full w-full rounded-full bg-slate-950/60 border border-white/10" />
                    </div>
                  )}
                  {c.type === 'PROFILE_THEME' && (
                    <div className="h-14 w-14 rounded-xl border border-white/10" style={previewStyle} />
                  )}
                  {c.type === 'TITLE' && (
                    <div className="h-14 w-24 rounded-xl border border-white/10 bg-slate-950/40 flex items-center justify-center text-sm font-bold text-slate-200">
                      <Sparkles className="h-5 w-5 text-amber-300" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {owned ? (
                  <button
                    className={`btn-press flex-1 rounded-xl px-4 py-2 text-sm font-semibold border transition-colors ${
                      equipped
                        ? 'border-blue-500/40 bg-blue-500/15 text-blue-200'
                        : 'border-slate-700/60 bg-slate-950/25 text-slate-200 hover:bg-slate-950/40'
                    }`}
                    onClick={() => equipCosmetic.mutate({ type: activeType, code: c.code })}
                    disabled={equipCosmetic.isPending}
                  >
                    {equipped ? 'Equipped' : 'Equip'}
                  </button>
                ) : (
                  <button
                    className="btn-press flex-1 rounded-xl px-4 py-2 text-sm font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => purchaseCosmetic.mutate(c.code)}
                    disabled={purchaseCosmetic.isPending || !canBuy}
                    title={!canBuy ? 'Nu ai suficienți WBC Coins' : 'Cumpără'}
                  >
                    Buy {c.priceCoins} WBC
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CosmeticShopPage;





