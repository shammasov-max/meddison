import React from 'react';
import { motion } from 'framer-motion';
import { GlowButton } from '../ui/GlowButton';
import { useData } from '../../hooks/useData';

interface BookingCTAProps {
  onOpenBooking: () => void;
  image?: string;
}

export const BookingCTA: React.FC<BookingCTAProps> = ({ onOpenBooking, image }) => {
  const { hero } = useData();

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background Image with Parallax-like fixed effect */}
      <div className="absolute inset-0">
        <img 
          src={image || hero?.image} 
          alt="Booking Background" 
          className="w-full h-full object-cover fixed-bg-effect"
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">
            Забронируйте лучший столик
          </h2>
          <div className="w-24 h-1 bg-amber-500 mx-auto mb-8" />
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Погрузитесь в атмосферу роскоши и комфорта. Мы подготовили для вас идеальное место для отдыха.
          </p>
          
          <GlowButton onClick={onOpenBooking}>
            Забронировать сейчас
          </GlowButton>
        </motion.div>
      </div>
    </section>
  );
};
