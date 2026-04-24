import React, { useState, useEffect } from 'react';
import { vfxManager } from '../logic/vfxManager';
import '../styles/combatText.css'; 

const CombatTextItem = ({ item, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(item.id);
    }, 2800); 
    return () => clearTimeout(timer);
  }, [item.id, onComplete]);

  const chars = Array.from(item.text).map((char, index) => (
    <span 
      key={index} 
      className="char" 
      style={{ '--char-index': index }}
    >
      {char}
    </span>
  ));

  return (
    <div 
      className="combat-text-container absolute" 
      style={{ 
        color: item.color,
        '--drop-duration': '440ms',
        '--hold-time': '1800ms',
        '--fade-duration': '640ms'
      }}
    >
      <div className="combat-text">
        {chars}
      </div>
    </div>
  );
};

export const CombatTextOverlay = () => {
  const [texts, setTexts] = useState([]);
  const [flashActive, setFlashActive] = useState(false);

  useEffect(() => {
    // Nasłuchuj na latające cyfry
    const unsubscribeTexts = vfxManager.subscribe((newItem) => {
      setTexts((prev) => [...prev, newItem]);
    });

    // Nasłuchuj na otrzymanie obrażeń (błysk)
    const unsubscribeFlash = vfxManager.subscribeFlash(() => {
      setFlashActive(true);
      // Wyłącz błysk po 400ms (czas trwania przejścia CSS)
      setTimeout(() => setFlashActive(false), 400);
    });

    return () => {
      unsubscribeTexts();
      unsubscribeFlash();
    };
  }, []);

  const handleComplete = (id) => {
    setTexts((prev) => prev.filter(t => t.id !== id));
  };

  return (
    <>
      {/* 1. Nakładka czerwonej winiety (Damage Flash) */}
      <div 
        className={`fixed inset-0 pointer-events-none z-[90] transition-opacity duration-300 ease-out ${flashActive ? 'opacity-100' : 'opacity-0'}`}
        style={{
          background: 'radial-gradient(circle, transparent 60%, rgba(255, 0, 0, 0.15) 100%)',
          boxShadow: 'inset 0 0 120px rgba(255,0,0,0.4)'
        }}
      />

      {/* 2. Teksty Bojowe */}
      {texts.length > 0 && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[100]">
          {texts.map((item) => (
            <CombatTextItem key={item.id} item={item} onComplete={handleComplete} />
          ))}
        </div>
      )}
    </>
  );
};