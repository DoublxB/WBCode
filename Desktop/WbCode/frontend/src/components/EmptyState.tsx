import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}: EmptyStateProps) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-primary-500/10 rounded-full blur-2xl" />
        <div className="relative w-20 h-20 rounded-full bg-slate-800/50 border-2 border-slate-700/50 flex items-center justify-center">
          <Icon className="h-10 w-10 text-slate-400" />
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 max-w-md mb-6">{description}</p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg hover:shadow-primary-500/50 transform hover:scale-105"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

