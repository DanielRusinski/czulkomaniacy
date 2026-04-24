import React from 'react';
import { motion } from 'framer-motion';

const Panel = ({ children, title, icon, className = '', ...props }) => {
  return (
    <motion.div 
      // Stylizacja Glossy: ciemne, półprzezroczyste tło, subtelny border i miękki cień
      className={`bg-[#1e293b]/80 backdrop-blur-md border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] rounded-[16px] overflow-hidden ${className}`}
      {...props}
    >
      {title && (
        <div className="px-8 py-5 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl filter drop-shadow-md">{icon}</span>}
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.15em]">
              {title}
            </h2>
          </div>
          
          {/* Ozdobne kontrolki w stylu Glossy Stepper (pasujące do przycisków Blue i Rose) */}
          <div className="flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-sm" 
                 style={{ backgroundImage: 'linear-gradient(135deg, #38bdf8, #34d399)' }} />
            <div className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-sm" 
                 style={{ backgroundImage: 'linear-gradient(135deg, #fb7185, #fbbf24)' }} />
          </div>
        </div>
      )}
      
      <div className="p-8 text-slate-200">
        {children}
      </div>
    </motion.div>
  );
};

export default Panel;