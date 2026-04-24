import React from 'react';
import { motion } from 'framer-motion';
import { audioManager } from '../../../logic/audioManager';

const Button = ({ 
  children, 
  onClick, 
  variant = 'blue', 
  size = 'md', 
  className = '', 
  disabled = false 
}) => {

  const variants = {
    blue: {
      bg: 'linear-gradient(135deg, color-mix(in srgb, #38bdf8 90%, transparent), color-mix(in srgb, #34d399 75%, transparent))',
      depth: '#0284c7',
      reflection: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,.40), rgba(255,255,255,.05) 60%)'
    },
    rose: {
      bg: 'linear-gradient(135deg, color-mix(in srgb, #fb7185 85%, transparent), color-mix(in srgb, #fbbf24 75%, transparent))',
      depth: '#be123c',
      reflection: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,.35), rgba(255,255,255,.05) 60%)'
    }
  };

  const selectedVariant = variants[variant] || variants.blue;

  const sizes = {
    sm: 'w-[38px] h-[38px] rounded-[14px]',
    md: 'px-6 py-3 min-w-[120px] rounded-[14px]',
    lg: 'w-[180px] h-[48px] rounded-[14px]', // Odpowiednik klasy .pill
  };

  const handleMouseEnter = () => {
    if (!disabled) {
      audioManager.play('hover');
    }
  };

  const handleClick = (e) => {
    if (!disabled) {
      audioManager.play('click');
      if (onClick) onClick(e);
    }
  };

  const shadowNormal = `
    0 1px 0 ${selectedVariant.depth},
    0 2px 0 ${selectedVariant.depth},
    0 3px 0 ${selectedVariant.depth},
    0 4px 0 ${selectedVariant.depth},
    0 5px 0 ${selectedVariant.depth},
    0 6px 0 ${selectedVariant.depth},
    0 12px 15px rgba(0, 0, 0, 0.4)
  `;

  const shadowActive = `
    0 1px 0 ${selectedVariant.depth},
    0 2px 0 ${selectedVariant.depth},
    0 2px 0 ${selectedVariant.depth},
    0 2px 0 ${selectedVariant.depth},
    0 2px 0 ${selectedVariant.depth},
    0 2px 0 ${selectedVariant.depth},
    0 5px 8px rgba(0, 0, 0, 0.4)
  `;

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { 
        y: 4, 
        boxShadow: shadowActive 
      } : {}}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      style={{
        backgroundImage: `${selectedVariant.reflection}, ${selectedVariant.bg}`,
        boxShadow: shadowNormal,
        backgroundSize: 'calc(100% + 2px) calc(100% + 2px)',
        backgroundPosition: 'center',
      }}
      className={`
        ${sizes[size]} 
        relative z-[2] border border-white/15 outline-none
        font-bold uppercase tracking-wider text-white transition-transform
        ${disabled ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer'}
        ${className}
        inline-flex items-center justify-center gap-2
      `}
    >
      {children}
    </motion.button>
  );
};

export default Button;