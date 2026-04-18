import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioManager } from '../logic/audioManager';

const ChanceModal = ({ chance, onClose }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Efekt Parallax 3D (identyczny jak w QuestionModal dla spójności)
  const handleMouseMove = useCallback((e) => {
    if (isTransitioning) return;
    const xAxis = (window.innerWidth / 2 - e.clientX) / 15;
    const yAxis = (window.innerHeight / 2 - e.clientY) / 15;
    setRotation({ x: yAxis, y: xAxis });
  }, [isTransitioning]);

  const handleMouseLeave = useCallback(() => {
    setRotation({ x: 0, y: 0 });
  }, []);

  const handleAccept = () => {
    setIsTransitioning(true);
    setRotation({ x: 0, y: 0 });
    audioManager.play('click'); // Założenie: masz taki dźwięk

    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-md"
        style={{ fontFamily: "'Quicksand', sans-serif" }}
      >
        <style>{`
          .chance-btn {
            appearance: none;
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 215, 0, 0.8);
            border-radius: 999px;
            color: #4a453c;
            cursor: pointer;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            padding: 15px 40px;
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.2);
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          
          .chance-btn:hover { 
            background: rgba(255, 215, 0, 0.4);
            transform: translateZ(30px) scale(1.05);
            box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
          }

          .star-float {
            animation: floating 3s ease-in-out infinite;
          }

          @keyframes floating {
            0%, 100% { transform: translateY(0) translateZ(60px); }
            50% { transform: translateY(-15px) translateZ(80px); }
          }
        `}</style>

        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          exit={{ scale: 0.5, opacity: 0, rotateY: 90 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
        >
          <div 
            style={{ perspective: '1200px', padding: '50px' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Karta 3D */}
            <div
              style={{
                width: '360px',
                height: '520px',
                padding: '12px',
                background: 'linear-gradient(135deg, #FFD700, #FFA500, #FF8C00)',
                borderRadius: '40px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.3), 0 0 30px rgba(255,215,0,0.3)',
                transformStyle: 'preserve-3d',
                transform: `rotateY(${rotation.y}deg) rotateX(${rotation.x}deg)`,
                transition: isTransitioning ? 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'transform 0.1s ease-out'
              }}
            >
              <div 
                className="w-full h-full border-[6px] border-white/50 box-border flex flex-col items-center justify-between p-8 bg-[#fffdf0] relative overflow-hidden"
                style={{ borderRadius: '30px', transformStyle: 'preserve-3d' }}
              >
                {/* Ozdobny wzór w tle */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(#FFA500 2px, transparent 2px)', backgroundSize: '20px 20px' }} />

                {/* Nagłówek Szansy */}
                <div 
                  className="text-center z-10"
                  style={{ transform: 'translateZ(40px)' }}
                >
                  <h2 className="text-4xl font-black text-[#634a00] italic tracking-tighter">SZANSA!</h2>
                  <div className="h-1 w-20 bg-[#FFA500] mx-auto mt-1 rounded-full" />
                </div>

                {/* Główna Ikona Gwiazdy */}
                <div 
                  className="text-8xl star-float z-10"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  ⭐
                </div>

                {/* Treść Szansy */}
                <div 
                  className="z-10 text-center"
                  style={{ transform: 'translateZ(50px)' }}
                >
                  <p className="text-xl font-bold text-[#4a453c] leading-tight">
                    {chance?.description || "Znalazłeś ukryty skarb na szlaku!"}
                  </p>
                  <p className="mt-4 text-2xl font-black text-[#d4af37]">
                    {chance?.effectText || "+50 Punktów"}
                  </p>
                </div>

                {/* Przycisk Akcji */}
                <div 
                  className="z-20 w-full"
                  style={{ transform: 'translateZ(70px)', pointerEvents: 'auto' }}
                >
                  <button 
                    onClick={handleAccept}
                    onMouseEnter={() => audioManager.play('hover')}
                    className="chance-btn w-full"
                  >
                    Wspaniale!
                  </button>
                </div>

                {/* Dekoracyjne rogi */}
                <div className="absolute top-4 left-4 text-[#FFD700] opacity-30 text-xl">✦</div>
                <div className="absolute bottom-4 right-4 text-[#FFD700] opacity-30 text-xl">✦</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ChanceModal;