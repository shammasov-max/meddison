import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useData } from '../../hooks/useData';
import smoke1 from '../../assets/images/smoke-1.jpg';
import smoke2 from '../../assets/images/smoke-2.jpg';
import heroSmoke from '../../assets/images/hero-smoke.png';

export const About: React.FC = () => {
  const { about } = useData();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  
  // Smooth mouse parallax
  const mouseX = useSpring(0, { stiffness: 50, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 50, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set(clientX / innerWidth - 0.5);
    mouseY.set(clientY / innerHeight - 0.5);
  };

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      id="about" 
      className="relative min-h-screen flex items-center bg-black overflow-hidden py-20"
    >
      {/* Background Parallax Layers */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          style={{ y: y1, x: useTransform(mouseX, [-0.5, 0.5], [-20, 20]) }}
          className="absolute inset-0 opacity-30"
        >
          <img src={smoke1} alt="" className="w-full h-full object-cover mix-blend-screen scale-110" />
        </motion.div>
        
        <motion.div 
          style={{ y: y2, x: useTransform(mouseX, [-0.5, 0.5], [30, -30]) }}
          className="absolute inset-0 opacity-40"
        >
          <img src={smoke2} alt="" className="w-full h-full object-cover mix-blend-screen scale-125" />
        </motion.div>

        <motion.div 
          style={{ y: y3, scale: 1.1 }}
          className="absolute bottom-0 left-0 w-full h-full opacity-60"
        >
          <img src={heroSmoke} alt="" className="w-full h-full object-cover mix-blend-screen" />
        </motion.div>
        
        {/* Vignette & Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Typography Art */}
          <div className="lg:col-span-5 relative flex flex-col justify-center h-full">
            <motion.div 
              style={{ opacity }}
              className="relative z-10"
            >
              <h2 className="text-[10vw] lg:text-[8vw] leading-none font-serif font-bold text-white/5 absolute -top-20 -left-10 select-none pointer-events-none writing-mode-vertical">
                PHILOSOPHY
              </h2>
              
              <div className="flex flex-col gap-2 relative">
                <motion.span 
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-5xl md:text-7xl lg:text-8xl font-serif font-thin text-white tracking-tight"
                >
                  Искусство
                </motion.span>
                
                <motion.span 
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-4xl md:text-6xl lg:text-7xl font-serif italic text-amber-500 self-end lg:mr-12"
                >
                  осознанного
                </motion.span>
                
                <motion.span 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-5xl md:text-7xl lg:text-8xl font-serif font-thin text-white tracking-tight self-center lg:self-start lg:ml-24"
                >
                  отдыха
                </motion.span>

                <motion.div 
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mt-8 w-full max-w-md self-center"
                />
              </div>
            </motion.div>
          </div>

          {/* Right Column: Content Card */}
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-12 rounded-3xl relative overflow-hidden group hover:border-amber-500/30 transition-colors duration-500"
            >
              {/* Card Glow Effect */}
              <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

              <div className="space-y-8 relative z-10">
                <p className="text-xl md:text-2xl text-white/90 font-light leading-relaxed">
                  {about?.description1}
                </p>
                <p className="text-white/60 leading-relaxed">
                  {about?.description2}
                </p>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
                  {about?.stats.map((stat, index) => (
                    <div key={index} className="group/stat">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-4xl md:text-5xl font-serif font-bold text-white group-hover/stat:text-amber-500 transition-colors duration-300">
                          {stat.value}
                        </span>
                        <span className="text-xs uppercase tracking-widest text-white/40">
                          {stat.label}
                        </span>
                      </div>
                      <p className="text-sm text-white/50">
                        {stat.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
