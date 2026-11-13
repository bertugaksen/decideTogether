import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundEffects } from '../utils/soundEffects.js';

export interface DuelCountdownProps {
  onComplete: () => void;
}

export const DuelCountdown: React.FC<DuelCountdownProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(3); // 3, 2, 1, 0 ('Başla')

  useEffect(() => {
    soundEffects.initOnUserGesture();
    soundEffects.playCountdownTick();

    let currentStep = 3;
    let completeTimeout: ReturnType<typeof setTimeout> | null = null;

    const interval = setInterval(() => {
      currentStep -= 1;
      if (currentStep === 0) {
        setStep(0);
        soundEffects.playStartFanfare();
        completeTimeout = setTimeout(() => {
          onComplete();
        }, 300);
      } else if (currentStep < 0) {
        clearInterval(interval);
        setStep(-1);
      } else {
        setStep(currentStep);
        soundEffects.playCountdownTick();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (completeTimeout) clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  if (step < 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FBF9F5]/90 backdrop-blur-sm select-none">
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
            <span className="font-display font-bold text-8xl text-[#1C1917]">
              {step}
            </span>
          ) : (
            <span className="font-display font-bold text-6xl text-[#E07A5F]">
              Başla
            </span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};