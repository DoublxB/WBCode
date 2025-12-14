interface SkeletonLoaderProps {
  type?: 'card' | 'text' | 'avatar' | 'button' | 'list';
  count?: number;
  className?: string;
}

const SkeletonLoader = ({ type = 'card', count = 1, className = '' }: SkeletonLoaderProps) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 ${className}`}>
            <div className="h-4 w-24 bg-slate-700 rounded mb-4 animate-pulse" />
            <div className="h-8 w-32 bg-slate-700 rounded mb-2 animate-pulse" />
            <div className="h-3 w-48 bg-slate-700 rounded animate-pulse" />
          </div>
        );
      
      case 'text':
        return (
          <div className={`space-y-2 ${className}`}>
            <div className="h-4 w-full bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-slate-700 rounded animate-pulse" />
          </div>
        );
      
      case 'avatar':
        return (
          <div className={`rounded-full bg-slate-700 animate-pulse ${className}`} />
        );
      
      case 'button':
        return (
          <div className={`h-10 w-32 bg-slate-700 rounded-lg animate-pulse ${className}`} />
        );
      
      case 'list':
        return (
          <div className={`space-y-3 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-700 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-slate-700 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-slate-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  if (type === 'list') {
    return <>{renderSkeleton()}</>;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

export default SkeletonLoader;

