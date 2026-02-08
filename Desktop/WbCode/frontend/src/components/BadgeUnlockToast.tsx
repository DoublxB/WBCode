import { useEffect } from 'react';
import { Award } from 'lucide-react';

export type BadgeUnlockPayload = {
  id: number; // unlock id
  createdAt: string;
  badge: {
    id: number;
    code: string;
    name: string;
    description: string;
    icon?: string | null;
    rarity?: string | null;
    animation?: string | null;
  };
};

type Props = {
  item: BadgeUnlockPayload;
  onDone: (unlockId: number) => void;
};

const BadgeUnlockToast = ({ item, onDone }: Props) => {
  const { badge } = item;
  const animation = badge.animation || (badge.rarity === 'LEGENDARY' ? 'confetti' : 'shine');

  useEffect(() => {
    const t = setTimeout(() => onDone(item.id), 5200);
    return () => clearTimeout(t);
  }, [item.id, onDone]);

  return (
    <div className={`badge-toast badge-toast-${animation}`}>
      <div className="badge-toast-inner">
        <div className="badge-toast-icon">
          {badge.icon ? (
            <span className="badge-toast-emoji" aria-hidden="true">
              {badge.icon}
            </span>
          ) : (
            <Award className="h-5 w-5 text-amber-300" />
          )}
        </div>
        <div className="badge-toast-content">
          <div className="badge-toast-title">{badge.name}</div>
          <div className="badge-toast-desc">{badge.description}</div>
        </div>
      </div>
    </div>
  );
};

export default BadgeUnlockToast;





