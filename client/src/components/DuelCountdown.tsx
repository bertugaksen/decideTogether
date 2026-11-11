import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundEffects } from '../utils/soundEffects.js';

export interface DuelCountdownProps {
  onComplete: () => void;
}

export const DuelCountdown: React.FC<DuelCountdownProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(3); // 3, 2, 1, 0 ('BAŞLA!')

  useEffect(() => {
    soundEffects.initOnUserGesture();
    soundEffects.playCountdownTick();

    const interval = setInterval(() => {
      setStep((prev) => {
        if (prev === 1) {
          soundEffects.playStartFanfare();
          return 0; // "BAŞLA! 🔥"
        }
        if (prev === 0) {
          clearInterval(interval);
          onComplete();
          return -1;
        }
        soundEffects.playCountdownTick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete]);

  if (step < 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          exit={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="text-center"
        >
          {step > 0 ? (
            <span className="font-display font-black text-8xl text-white drop-shadow-lg">
              {step}
            </span>
          ) : (
            <span className="font-display font-black text-6xl text-[#D9381E] drop-shadow-xl animate-pulse">
              BAŞLA! 🔥
            </span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
