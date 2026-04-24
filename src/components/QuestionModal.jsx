import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioManager } from '../logic/audioManager';

const categoryIcons = {
  forest: '🌲', 
  mountains: '🏔️', 
  lake: '💧', 
  meadow: '🌿', 
  boss: '👿'
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const OPTION_COLORS = [
  'rgba(242, 141, 141, 0.4)', 
  'rgba(197, 179, 230, 0.4)', 
  'rgba(178, 226, 226, 0.4)', 
  'rgba(244, 178, 207, 0.4)'  
];

const QuestionModal = ({ question, isBoss, onClose }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [isCorrectState, setIsCorrectState] = useState(null);

  // Pobieranie wartości nagrody i kary z tablic parametrów [sukces, porażka]
  const rewardPoints = question?.points?.[0] || 0;
  const penaltyLife = question?.life?.[1] || 0;
  const bonusMove = question?.movement_impact?.[0] || 0;

  const handleMouseMove = useCallback((e) => {
    if (isTransitioning) return;
    const xAxis = (window.innerWidth / 2 - e.clientX) / 15;
    const yAxis = (window.innerHeight / 2 - e.clientY) / 15;
    setRotation({ x: yAxis, y: xAxis });
  }, [isTransitioning]);

  const handleMouseLeave = useCallback(() => {
    if (isTransitioning) return;
    setRotation({ x: 0, y: 0 });
  }, [isTransitioning]);

  const handleAnswer = (opt) => {
    if (selectedOpt !== null || isTransitioning) return;
    
    const correct = opt === question.answer;
    setSelectedOpt(opt);
    setIsCorrectState(correct);
    setIsTransitioning(true);
    setRotation({ x: 0, y: 0 }); 

    setTimeout(() => {
      onClose(correct);
    }, 1500);
  };

  const getOptionAnimationClass = (opt) => {
    if (selectedOpt !== opt) return '';
    return isCorrectState ? 'correct-anim' : 'wrong-anim';
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        style={{ fontFamily: "'Quicksand', sans-serif" }}
      >
        <style>{`
          .opt-btn {
            appearance: none;
            border: 2px solid rgba(93, 156, 236, 0.8);
            border-radius: 999px;
            color: #5d9cec;
            cursor: pointer;
            font-family: 'Quicksand', sans-serif;
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            padding: 12px 30px;
            box-shadow: 2px 3px 8px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
            width: 100%;
            display: inline-flex;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }
          
          .opt-btn:hover:not(:disabled) { 
            background-color: rgba(230, 240, 250, 0.9) !important;
            box-shadow: 3px 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateZ(40px) scale(1.02); 
          }
          
          .correct-anim { 
            background-color: #4ade80 !important; 
            border-color: #4ade80 !important;
            color: #ffffff !important;
            backdrop-filter: none;
            animation: pulse-card 0.5s ease forwards; 
          }
          .wrong-anim { 
            background-color: #f87171 !important; 
            border-color: #f87171 !important;
            color: #ffffff !important;
            backdrop-filter: none;
            animation: shake-card 0.4s ease forwards; 
          }

          @keyframes pulse-card {
            0%, 100% { transform: scale(1) translateZ(40px); }
            50% { transform: scale(1.05) translateZ(60px); }
          }
          @keyframes shake-card {
            0%, 100% { transform: translateX(0) translateZ(40px); }
            25% { transform: translateX(-8px) translateZ(40px); }
            75% { transform: translateX(8px) translateZ(40px); }
          }
        `}</style>

        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        >
          <div 
            style={{ perspective: '1200px', padding: '50px' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div
              style={{
                width: '380px',
                height: '580px',
                padding: '14px',
                background: isBoss 
                  ? 'linear-gradient(to bottom, #ff4e50, #f9d423)' 
                  : 'linear-gradient(to bottom, #EEFF00, #BEF5FF)',
                borderRadius: '45px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                transformStyle: 'preserve-3d',
                transform: `rotateY(${rotation.y}deg) rotateX(${rotation.x}deg)`,
                transition: isTransitioning ? 'transform 0.5s ease' : 'transform 0.1s ease-out'
              }}
            >
              <div 
                className="w-full h-full border-[7px] border-white box-border flex flex-col justify-between p-5 bg-[#fdfaf0] relative"
                style={{ 
                  borderRadius: '31px',
                  backgroundImage: "url('/ZosiaCardTemplate_clearedbubblegum.png')",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center center',
                  backgroundSize: 'cover',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div 
                  className="h-full flex flex-col justify-between z-10"
                  style={{ 
                    transform: 'translateZ(50px)', 
                    pointerEvents: 'none', 
                    transformStyle: 'preserve-3d' 
                  }}
                >
                  
                  {/* Wyświetlanie STAWKI na górze (Opcjonalnie) */}
                  <div className="flex justify-center gap-2 mb-2">
                    {bonusMove > 0 && (
                      <span className="bg-bubblegum-yellow px-2 py-1 rounded-full text-[10px] font-black border-2 border-black">
                        BONUSOWY RZUT 🎲
                      </span>
                    )}
                  </div>

                  <div 
                    className="border-[4px] border-double border-[#444] rounded-[15px] p-[15px] my-2 text-[1.2rem] text-center font-bold text-[#4a453c]"
                    style={{ background: 'rgba(255,255,255,0.7)' }}
                  >
                    {question?.question || "Brak pytania?"}
                  </div>

                  <div 
                    className="flex flex-col gap-2 mt-4" 
                    style={{ pointerEvents: 'auto', transformStyle: 'preserve-3d' }}
                  >
                    {question?.options?.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(opt)}
                        onMouseEnter={() => {
                          if (selectedOpt === null) audioManager.play('hover');
                        }}
                        disabled={selectedOpt !== null}
                        className={`opt-btn w-full p-3 rounded-[30px] font-bold text-center cursor-pointer ${getOptionAnimationClass(opt)}`}
                        style={{ backgroundColor: OPTION_COLORS[idx % OPTION_COLORS.length] }}
                      >
                        {OPTION_LABELS[idx]}: {opt}
                      </button>
                    ))}
                  </div>

                  {/* STOPKA: Dynamiczne info o nagrodzie i karze */}
                  <div className="flex flex-col gap-1 mt-4">
                     <div className="flex justify-between items-center bg-white/80 border-2 border-black/10 rounded-xl px-3 py-2">
                        <span className="text-[11px] font-black text-green-600 uppercase">Nagroda: +{rewardPoints} PKT</span>
                        <span className="text-[11px] font-black text-red-600 uppercase">Kara: {penaltyLife} HP</span>
                     </div>

                    <div className="flex justify-between items-center px-1">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Poziom: {question?.level || 'Eko'}
                      </div>
                      <div className="text-4xl">
                        {isBoss ? categoryIcons.boss : (categoryIcons[question?.category] || '❓')}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuestionModal;