import React from 'react';
import { motion } from 'framer-motion';
// Wychodzimy z core (..), wychodzimy z ui (..), wychodzimy z components (..) i wchodzimy do logic
import { audioManager } from '../../../logic/audioManager';

const Button = ({ 
  children, 
  onClick, 
  variant = 'pink', 
  size = 'md', 
  className = '', 
  disabled = false 
}) => {
  
  // Warianty Neobrutalistyczne
  const variants = {
    pink: 'bg-bubblegum-pink text-black border-black',
    blue: 'bg-bubblegum-blue text-black border-black',
    green: 'bg-bubblegum-green text-black border-black',
    yellow: 'bg-bubblegum-yellow text-black border-black',
    ghost: 'bg-white text-gray-500 border-black',
  };

  // Rozmiary z grubym obramowaniem i specyficznym cieniem
  const sizes = {
    sm: 'px-4 py-2 text-xs rounded-lg border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
    md: 'px-6 py-3 text-sm rounded-xl border-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    lg: 'px-10 py-5 text-xl rounded-2xl border-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
  };

  const handleMouseEnter = () => {
    if (!disabled) {
      audioManager.play('hover');
    }
  };

  const handleClick = (e) => {
    if (!disabled) {
      audioManager.play('click'); // Dźwięk kliknięcia
      if (onClick) onClick(e);
    }
  };

  return (
    <motion.button
      // Efekt uniesienia (hover) i wciśnięcia (tap)
      whileHover={!disabled ? { 
        y: -2, 
        x: -2, 
        boxShadow: size === 'lg' ? "8px 8px 0px 0px #000" : "6px 6px 0px 0px #000" 
      } : {}}
      whileTap={!disabled ? { 
        y: 2, 
        x: 2, 
        boxShadow: "0px 0px 0px 0px #000" 
      } : {}}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      className={`
        ${variants[variant]} 
        ${sizes[size]} 
        font-bold uppercase tracking-wider transition-all
        ${disabled ? 'opacity-40 cursor-not-allowed grayscale shadow-none' : 'cursor-pointer'}
        ${className}
        inline-flex items-center justify-center gap-2
      `}
    >
      {children}
    </motion.button>
  );
};

export default Button;