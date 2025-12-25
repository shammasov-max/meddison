import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookingModal } from '../ui/BookingModal';

export const LoyaltyCTA: React.FC = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src="https://public.youware.com/users-website-assets/prod/a16cb3b4-00b7-495f-9707-a4ea508f80d2/6969ebcaa85440e89a61de73f2461e1b.jpg" 
          alt="Lounge Atmosphere" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-serif font-bold text-white mb-8"
          >
            Готовы стать частью привилегированного клуба?
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/80 mb-12"
          >
            Оформите карту прямо сейчас и получите 500 приветственных бонусов. 
            Или забронируйте стол, чтобы насладиться атмосферой Medisson Lounge.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row gap-6 justify-center items-center"
          >
            <a 
              href="https://app.loona.ai/4456/create?source=Medisson&tag=site"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto px-10 py-4 bg-amber-500 text-black font-bold uppercase tracking-widest hover:bg-amber-400 transition-colors rounded-sm text-center"
            >
              Оформить карту
            </a>
            
            <button 
              onClick={() => setIsBookingOpen(true)}
              className="w-full md:w-auto px-10 py-4 border border-white text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all rounded-sm"
            >
              Забронировать стол
            </button>
          </motion.div>
        </div>
      </div>

      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
      />
    </section>
  );
};
