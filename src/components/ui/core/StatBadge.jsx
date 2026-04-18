import React from 'react';

const StatBadge = ({ label, value, icon, color = 'pink', className = '' }) => {
  const colors = {
    pink: 'bg-bubblegum-pink',
    blue: 'bg-bubblegum-blue',
    green: 'bg-bubblegum-green',
    yellow: 'bg-bubblegum-yellow'
  };

  return (
    <div className={`
      ${colors[color]} 
      border-2 border-black 
      shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
      rounded-xl p-3 flex items-center gap-3 
      ${className}
    `}>
      {icon && (
        <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
          {icon}
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-black/60 uppercase tracking-widest leading-none mb-1">
          {label}
        </span>
        <span className="text-lg font-bold text-black leading-none tracking-tight">
          {value}
        </span>
      </div>
    </div>
  );
};

export default StatBadge;