import React from 'react';
import { motion } from 'framer-motion';

const ImpactEffect = ({ color = "#FFC1CC" }) => {
  // Generujemy 6 losowych cząsteczek
  const particles = Array.from({ length: 6 });

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* 1. Rozszerzający się okrąg (Shockwave) */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0.8, borderWidth: "6px" }}
        animate={{ scale: 2.5, opacity: 0, borderWidth: "0px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute w-12 h-12 rounded-full border-black"
        style={{ borderColor: color }}
      />

      {/* 2. Cząsteczki (Debris) */}
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const velocity = 40 + Math.random() * 40;
        const targetX = Math.cos(angle) * velocity;
        const targetY = Math.sin(angle) * velocity - 20; // Lecą lekko w górę

        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ 
              x: targetX, 
              y: targetY, 
              scale: 0,
              opacity: 0,
              rotate: Math.random() * 360 
            }}
            transition={{ duration: 0.6, ease: "backOut" }}
            className="absolute w-3 h-3 border-2 border-black"
            style={{ backgroundColor: color, borderRadius: i % 2 === 0 ? '50%' : '4px' }}
          />
        );
      })}
    </div>
  );
};

export default ImpactEffect;