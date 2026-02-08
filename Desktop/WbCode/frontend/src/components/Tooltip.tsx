import { useState, ReactNode } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip = ({ content, children, position = 'top' }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children || (
        <Info className="h-3.5 w-3.5 text-zinc-500 hover:text-zinc-400 cursor-help transition-colors" />
      )}
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-xs text-white bg-zinc-900 rounded-lg shadow-xl border border-white/10 whitespace-normal max-w-xs ${positionClasses[position]} pointer-events-none`}
        >
          {content}
          <div className={`absolute w-2 h-2 bg-zinc-900 border-r border-b border-white/10 transform rotate-45 ${
            position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
            position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
            position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' :
            'right-full top-1/2 -translate-y-1/2 -mr-1'
          }`} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;





