import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioManager } from '../logic/audioManager';

const SecretPassageModal = ({ passage, onClose }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Efekt Parallax 3D
  const handleMouseMove = useCallback((e) => {
    if (isTransitioning) return;
    const xAxis = (window.innerWidth / 2 - e.clientX) / 15;
    const yAxis = (window.innerHeight / 2 - e.clientY) / 15;
    setRotation({ x: yAxis, y: xAxis });
  }, [isTransitioning]);

  const handleMouseLeave = useCallback(() => {
    setRotation({ x: 0, y: 0 });
  }, []);

  const handleEnter = () => {
    setIsTransitioning(true);
    setRotation({ x: 0, y: 0 });
    audioManager.play('secret_open'); // Założenie: dźwięk przesuwanych kamieni

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[130] flex items-center justify-center bg-[#1a1a1a]/80 backdrop-blur-xl"
        style={{ fontFamily: "'Quicksand', sans-serif" }}
      >
        <style>{`
          .passage-btn {
            appearance: none;
            background: rgba(211, 84, 0, 0.1);
            border: 2px solid #e67e22;
            border-radius: 12px;
            color: #f39c12;
            cursor: pointer;
            font-weight: 800;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            padding: 15px 40px;
            box-shadow: 0 4px 15px rgba(230, 126, 34, 0.3);
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          
          .passage-btn:hover { 
            background: rgba(230, 126, 34, 0.3);
            box-shadow: 0 0 20px #e67e22;
            transform: translateZ(30px) scale(1.02);
            color: #fff;
          }

          .rumble-anim {
            animation: rumble 0.1s linear infinite;
          }

          @keyframes rumble {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            25% { transform: translate(-1px, -1px) rotate(0.1deg); }
            50% { transform: translate(-2px, 0px) rotate(-0.1deg); }
            75% { transform: translate(1px, -1px) rotate(0deg); }
            100% { transform: translate(1px, 1px) rotate(0deg); }
          }
        `}</style>

        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 90 }}
        >
          <div 
            style={{ perspective: '1200px', padding: '50px' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Karta 3D */}
            <div
              className={isTransitioning ? "rumble-anim" : ""}
              style={{
                width: '360px',
                height: '520px',
                padding: '14px',
                background: 'linear-gradient(135deg, #2c3e50, #000000)',
                borderRadius: '20px',
                boxShadow: '0 30px 70px rgba(0,0,0,0.5), inset 0 0 40px rgba(230, 126, 34, 0.1)',
                transformStyle: 'preserve-3d',
                transform: `rotateY(${rotation.y}deg) rotateX(${rotation.x}deg)`,
                transition: isTransitioning ? 'transform 0.1s linear' : 'transform 0.1s ease-out'
              }}
            >
              <div 
                className="w-full h-full border-2 border-[#e67e22]/20 box-border flex flex-col items-center justify-between p-8 bg-[#1c1c1c] relative overflow-hidden"
                style={{ borderRadius: '12px', transformStyle: 'preserve-3d' }}
              >
                {/* Tekstura kamienia / wzór mchu */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                     style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-matter.png")' }} />

                {/* Nagłówek */}
                <div className="text-center z-10" style={{ transform: 'translateZ(40px)' }}>
                  <h2 className="text-2xl font-black text-[#e67e22] tracking-[0.3em] uppercase">Tajemne Przejście</h2>
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-[#e67e22] to-transparent mt-2" />
                </div>

                {/* Ikona Przejścia */}
                <div 
                  className="text-8xl z-10"
                  style={{ 
                    transform: 'translateZ(60px)', 
                    filter: 'drop-shadow(0 0 15px rgba(230,126,34,0.4))' 
                  }}
                >
                  🚪
                </div>

                {/* Treść */}
                <div className="z-10 text-center" style={{ transform: 'translateZ(50px)' }}>
                  <p className="text-amber-100/60 text-xs uppercase tracking-widest mb-3">Odkryto skrót</p>
                  <p className="text-lg font-bold text-gray-200 leading-snug">
                    {passage?.description || "Zauważyłeś obluzowany kamień w ścianie... Ścieżka prowadzi prosto do celu!"}
                  </p>
                  <div className="mt-5 inline-block px-4 py-1 rounded border border-amber-900/50 bg-amber-950/20">
                    <span className="text-amber-500 font-mono text-sm">Omijasz 4 sektory</span>
                  </div>
                </div>

                {/* Przycisk Akcji */}
                <div className="z-20 w-full" style={{ transform: 'translateZ(80px)', pointerEvents: 'auto' }}>
                  <button 
                    onClick={handleEnter}
                    onMouseEnter={() => audioManager.play('hover')}
                    className="passage-btn w-full"
                  >
                    WEJDŹ
                  </button>
                </div>

                {/* Dekoracje - Antyczne runy w rogach */}
                <div className="absolute top-4 left-4 text-[#e67e22]/20 text-lg font-serif">ᛘ</div>
                <div className="absolute bottom-4 right-4 text-[#e67e22]/20 text-lg font-serif">ᚱ</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SecretPassageModal;