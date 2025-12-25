import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface BookingSuccessProps {
  onClose: () => void;
}

export const BookingSuccess: React.FC<BookingSuccessProps> = ({ onClose }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 space-y-8 min-h-[400px]">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-400" strokeWidth={1.5} />
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h3 className="text-3xl font-bold text-white">Заявка принята!</h3>
        <p className="text-white/60 max-w-xs mx-auto leading-relaxed">
          Мы свяжемся с вами в ближайшее время для подтверждения бронирования.
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={onClose}
        className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] active:scale-[0.99] transition-all duration-300"
      >
        Отлично
      </motion.button>
    </div>
  );
};
