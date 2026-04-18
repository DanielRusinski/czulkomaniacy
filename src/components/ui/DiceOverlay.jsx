import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const DiceOverlay = ({ isRolling, targetValue, onFinish }) => {
  const [displayValue, setDisplayValue] = useState(1);

  useEffect(() => {
    let interval;
    if (isRolling) {
      interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 80); // Szybkość zmiany cyfr
      
      const timer = setTimeout(() => {
        clearInterval(interval);
        setDisplayValue(targetValue);
        if (onFinish) onFinish();
      }, 800); // Czas trwania losowania
      
      return () => { clearInterval(interval); clearTimeout(timer); };
    } else {
      setDisplayValue(targetValue);
    }
  }, [isRolling, targetValue, onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto">
      <motion.div 
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 15 }}
        className="bg-white rounded-[40px] shadow-2xl w-64 h-64 flex items-center justify-center border-8 border-bubblegum-pink relative overflow-hidden"
      >
        <span className="text-[120px] font-black text-bubblegum-pink drop-shadow-md leading-none">
          {displayValue}
        </span>
      </motion.div>
    </div>
  );
};

export default DiceOverlay;