import React from 'react';
import { motion } from 'framer-motion';

const Panel = ({ children, title, icon, className = '', ...props }) => {
  return (
    <motion.div 
      // Zastosowanie klasy neobrutalist-panel zdefiniowanej w CSS
      className={`bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-[24px] overflow-hidden ${className}`}
      {...props}
    >
      {title && (
        <div className="bg-white px-8 py-5 border-b-4 border-black flex justify-between items-center">
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl filter drop-shadow-sm">{icon}</span>}
            <h2 className="text-xl font-bold text-black uppercase tracking-tight">
              {title}
            </h2>
          </div>
          
          {/* Ozdobny element "kontrolny" w stylu retro UI */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 border-2 border-black rounded-full bg-bubblegum-pink" />
            <div className="w-3 h-3 border-2 border-black rounded-full bg-bubblegum-blue" />
          </div>
        </div>
      )}
      
      <div className="p-8">
        {children}
      </div>
    </motion.div>
  );
};

export default Panel;