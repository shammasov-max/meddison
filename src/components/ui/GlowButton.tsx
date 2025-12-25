import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlowButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  className?: string;
}

export const GlowButton: React.FC<GlowButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <motion.button
      {...props}
      className={`
        relative group
        px-10 py-5 rounded-full 
        bg-black/60 backdrop-blur-md
        border border-amber-500
        text-amber-500 font-bold uppercase tracking-[0.2em]
        shadow-[0_0_20px_rgba(212,175,55,0.3)]
        transition-all duration-300
        hover:bg-black/80
        hover:border-amber-400
        hover:text-amber-300
        hover:shadow-[0_0_40px_rgba(212,175,55,0.6)]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
        ${className}
      `}
      whileHover={props.disabled ? {} : { scale: 1.05 }}
      whileTap={props.disabled ? {} : { scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        boxShadow: [
          "0 0 20px rgba(212,175,55,0.3)",
          "0 0 35px rgba(212,175,55,0.5)",
          "0 0 20px rgba(212,175,55,0.3)",
        ]
      }}
      transition={{
        opacity: { duration: 0.5 },
        y: { duration: 0.5 },
        boxShadow: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        },
        scale: { duration: 0.2 }
      }}
    >
      <span className="relative z-10">{children}</span>
      
      {/* Inner gradient glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.button>
  );
};
