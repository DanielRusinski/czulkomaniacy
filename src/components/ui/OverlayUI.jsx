import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import styles from './OverlayUI.module.css';

// Komponenty UI
import GameHUD from './GameHUD';
import ActiveTileHUD from './ActiveTileHUD';
import TurnIndicator from './TurnIndicator';
import UiTurns from './uiTurns_ss';
import ModalsLayer from '../ModalsLayer';

export default function OverlayUI() {
  // 1. POBIERANIE DANYCH ZE STORE
  const view = useGameStore((state) => state.view);
  const turnNotification = useGameStore((state) => state.turnNotification);
  const currentPlayer = useGameStore((state) => state.getCurrentPlayer());

  // 2. BEZPIECZNIK (GUARD)
  // Jeśli widok to 'home' lub 'setup', nie renderujemy nakładki gry.
  // App.jsx zajmuje się renderowaniem HomeView/SetupView osobno.
  if (view === 'home' || view === 'setup') return null;

  return (
    <div className={styles.uiRoot}>
      
      {/* WARSTWA INFORMACYJNA (HUD) */}
      <div className={styles.hudLayer}>
        <UiTurns />
        
        {/* Usunięto prop activePlayer - TurnIndicator sam go pobierze ze Store */}
        <TurnIndicator />
        
        <div className={styles.mainHudWrapper}>
          <GameHUD />
        </div>
      </div>

      {/* WARSTWA POWIADOMIEŃ (Framer Motion) */}
      <AnimatePresence>
        {turnNotification && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, transition: { duration: 0.2 } }}
            className={styles.notificationOverlay}
          >
            <div className={styles.notificationCard}>
              <div className={styles.icon}>
                {currentPlayer?.icon || '👤'}
              </div>
              <h2 className={styles.title}>
                {turnNotification.name}
              </h2>
              <p className={styles.message}>
                {turnNotification.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WARSTWA INTERAKCJI (Kostka i Pola) */}
      {/* Usunięto wszystkie propsy - ActiveTileHUD jest teraz autonomicznym komponentem */}
      <ActiveTileHUD />

      {/* WARSTWA MODALI (Menu, Baza, Ustawienia) */}
      <ModalsLayer />
      
    </div>
  );
}