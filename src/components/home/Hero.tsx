import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useData } from '../../hooks/useData';
import { ChevronDown } from 'lucide-react';
import { GlowButton } from '../ui/GlowButton';
import heroSmoke from '../../assets/images/hero-smoke.png';
import logo from '../../assets/images/logo.svg';

interface HeroProps {
  onOpenBooking?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenBooking }) => {
  const { hero } = useData();
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden bg-black flex items-center justify-center">
      {/* Abstract Smoke Animation Background */}
      <div className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none">
        {/* Layer 1 - Clockwise */}
        <motion.div
          className="absolute w-[140vw] h-[140vw] md:w-[100vw] md:h-[100vw] opacity-40"
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            rotate: { duration: 120, repeat: Infinity, ease: "linear" },
            scale: { duration: 20, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <img 
            src={heroSmoke} 
            alt="" 
            className="w-full h-full object-contain mix-blend-screen opacity-60" 
          />
        </motion.div>
        
        {/* Layer 2 - Counter-Clockwise & Offset */}
        <motion.div
          className="absolute w-[120vw] h-[120vw] md:w-[90vw] md:h-[90vw] opacity-30"
          animate={{ 
            rotate: -360,
            scale: [1.1, 1, 1.1],
          }}
          transition={{ 
            rotate: { duration: 150, repeat: Infinity, ease: "linear" },
            scale: { duration: 25, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <img 
            src={heroSmoke} 
            alt="" 
            className="w-full h-full object-contain mix-blend-screen opacity-40 filter hue-rotate-15" 
            style={{ transform: 'scaleX(-1)' }}
          />
        </motion.div>

        {/* Central Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-900/10 to-black/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 flex flex-col justify-center items-center text-center h-full">
        <motion.div
          style={{ opacity }}
          className="flex flex-col items-center justify-center h-full pt-20"
        >
          {/* Logo Reveal Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, filter: 'blur(20px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            className="mb-12 relative"
          >
            {/* Ambient Glow behind Logo */}
            <motion.div 
              className="absolute inset-0 bg-amber-500/30 blur-[80px] rounded-full"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <img 
              src={logo} 
              alt="Medisson Lounge" 
              className="w-48 md:w-72 h-auto relative z-10 invert brightness-0 filter drop-shadow-[0_0_25px_rgba(212,175,55,0.3)]"
              style={{ filter: 'brightness(0) invert(1)' }} 
            />
          </motion.div>

          {/* Slogan & Description */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="space-y-8 max-w-2xl"
          >
            <h2 className="text-amber-500/90 text-sm md:text-lg uppercase tracking-[0.4em] font-light">
              {hero?.slogan}
            </h2>

            <p className="text-white/70 text-lg md:text-xl font-light leading-relaxed">
              {hero?.description}
            </p>
            
            <motion.div 
              className="pt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 2 }}
            >
              <GlowButton onClick={onOpenBooking}>
                Забронировать стол
              </GlowButton>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/30 animate-bounce"
      >
        <ChevronDown size={24} />
      </motion.div>
    </section>
  );
};
