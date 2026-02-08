import React from 'react';

interface WBCCoinProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animation?: 'none' | 'spin' | 'float' | 'both';
}

const WBCCoin = ({ size = 'md', className = '', animation = 'none' }: WBCCoinProps) => {
  // Mărimi disponibile
  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-16 h-16 text-sm',
    lg: 'w-32 h-32 text-2xl',
    xl: 'w-64 h-64 text-6xl'
  };

  // Clase pentru animații
  const animClasses = {
    none: '',
    spin: 'coin-spin',
    float: 'coin-float',
    both: 'coin-spin coin-float'
  };

  return (
    <div
      className={`
        relative rounded-full flex items-center justify-center font-bold select-none 
        ${sizeClasses[size]} 
        ${animClasses[animation]} 
        ${className} 
        coin-3d
      `}
    >
      {/* 1. Inel Exterior (Gradient Auriu Puternic) */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-500 to-yellow-800 shadow-xl border-2 border-yellow-100"></div>

      {/* 2. Inel Interior (Adâncime) */}
      <div className="absolute inset-[8%] rounded-full bg-gradient-to-tl from-yellow-700 via-yellow-400 to-yellow-100 border border-yellow-600 shadow-inner flex items-center justify-center">
        {/* 3. Nucleul (Branding / Dark Mode Style) */}
        <div className="absolute inset-[15%] rounded-full bg-slate-900 flex items-center justify-center border border-yellow-500/40 shadow-lg">
          {/* 4. Textul Metalic */}
          <span
            className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-700 font-black tracking-tighter drop-shadow-sm"
            style={{ fontFamily: 'monospace' }}
          >
            WBC
          </span>
        </div>
      </div>

      {/* 5. Efect de Luciu (Reflexie) */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/50 via-transparent to-transparent opacity-40 pointer-events-none"></div>
    </div>
  );
};

export default WBCCoin;





