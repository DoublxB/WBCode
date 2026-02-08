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
            <div className="h-4 w-24 rounded mb-4 skeleton" />
            <div className="h-8 w-32 rounded mb-2 skeleton" />
            <div className="h-3 w-48 rounded skeleton" />
          </div>
        );
      
      case 'text':
        return (
          <div className={`space-y-2 ${className}`}>
            <div className="h-4 w-full rounded skeleton" />
            <div className="h-4 w-5/6 rounded skeleton" />
            <div className="h-4 w-4/6 rounded skeleton" />
          </div>
        );
      
      case 'avatar':
        return (
          <div className={`rounded-full skeleton ${className}`} />
        );
      
      case 'button':
        return (
          <div className={`h-10 w-32 rounded-lg skeleton ${className}`} />
        );
      
      case 'list':
        return (
          <div className={`space-y-3 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded skeleton" />
                  <div className="h-3 w-1/2 rounded skeleton" />
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
        <div key={i}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

export default SkeletonLoader;





