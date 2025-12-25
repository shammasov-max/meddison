
import React from 'react';
import { motion } from 'framer-motion';
import logo from '../../assets/images/logo.svg';

export const Preloader: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 1, delay: 2.5, ease: "easeInOut" }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center pointer-events-none"
    >
      <div className="relative overflow-hidden flex flex-col items-center">
        <motion.img
          src={logo}
          alt="Medisson Logo"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-24 md:h-32 w-auto mb-4"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
          className="h-1 bg-amber-500 w-32"
        />
      </div>
    </motion.div>
  );
};
