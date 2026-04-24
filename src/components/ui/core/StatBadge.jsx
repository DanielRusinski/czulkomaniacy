import React from 'react';

const StatBadge = ({ label, value, icon, color = 'blue', className = '' }) => {
  // Mapowanie kolorów na gradienty i poświaty pasujące do stylu Glossy
  const glowColors = {
    blue: 'from-blue-400/20 to-emerald-400/20 text-blue-400',
    rose: 'from-rose-400/20 to-amber-400/20 text-rose-400',
    green: 'from-emerald-400/20 to-teal-400/20 text-emerald-400',
    yellow: 'from-amber-400/20 to-orange-400/20 text-amber-400'
  };

  const selectedColor = glowColors[color] || glowColors.blue;

  return (
    <div className={`
      relative overflow-hidden
      bg-white/5 backdrop-blur-md
      border border-white/10 
      rounded-2xl p-3 flex items-center gap-4 
      transition-all duration-300
      hover:bg-white/10 hover:border-white/20
      ${className}
    `}>
      {/* Dekoracyjna poświata w tle */}
      <div className={`absolute -left-4 -top-4 w-12 h-12 bg-gradient-to-br ${selectedColor} blur-2xl opacity-30`} />

      {icon && (
        <div className={`
          w-11 h-11 
          bg-slate-800/50 
          border border-white/10 
          rounded-xl flex items-center justify-center 
          text-xl shrink-0
          shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]
          ${selectedColor.split(' ').pop()} // Wybiera klasę tekstową (kolor ikony)
        `}>
          {icon}
        </div>
      )}

      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">
          {label}
        </span>
        <span className="text-xl font-bold text-white leading-none tracking-tight drop-shadow-sm">
          {value}
        </span>
      </div>
    </div>
  );
};

export default StatBadge;