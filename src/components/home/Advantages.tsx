import React from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../hooks/useData';
import { getIcon } from '../../utils/iconResolver';

export const Advantages = () => {
  const { advantages } = useData();

  return (
    <section className="py-32 bg-zinc-950 relative overflow-hidden">
      {/* Abstract Background Lines (Golden Building Lines) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Left Side Lines */}
        <svg className="absolute top-0 left-0 h-full w-32 md:w-64 opacity-20" viewBox="0 0 100 800" preserveAspectRatio="none">
          <motion.path
            d="M 20 0 V 800"
            stroke="#d4af37"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <motion.path
            d="M 50 100 V 700"
            stroke="#d4af37"
            strokeWidth="0.5"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 2.5, delay: 0.5, ease: "easeInOut" }}
          />
           <motion.path
            d="M 80 200 V 600"
            stroke="#d4af37"
            strokeWidth="0.5"
            strokeDasharray="5 5"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 3, delay: 1, ease: "easeInOut" }}
          />
        </svg>

        {/* Right Side Lines */}
        <svg className="absolute top-0 right-0 h-full w-32 md:w-64 opacity-20 transform scale-x-[-1]" viewBox="0 0 100 800" preserveAspectRatio="none">
          <motion.path
            d="M 20 0 V 800"
            stroke="#d4af37"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <motion.path
            d="M 50 100 V 700"
            stroke="#d4af37"
            strokeWidth="0.5"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 2.5, delay: 0.5, ease: "easeInOut" }}
          />
           <motion.path
            d="M 80 200 V 600"
            stroke="#d4af37"
            strokeWidth="0.5"
            strokeDasharray="5 5"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 3, delay: 1, ease: "easeInOut" }}
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4 text-white">
            {advantages?.title}
          </h2>
          <div className="w-24 h-1 bg-amber-500 mx-auto mb-6" />
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            {advantages?.subtitle}
          </p>
        </motion.div>

        {/* Diagram Layout */}
        <div className="relative max-w-6xl mx-auto">
          {/* Central Axis Lines (The "Diagram" Structure) */}
          <div className="absolute inset-0 pointer-events-none hidden md:block">
            {/* Vertical Center Line */}
            <motion.div 
              initial={{ height: 0 }}
              whileInView={{ height: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute left-1/2 top-0 w-[1px] bg-gradient-to-b from-transparent via-amber-500/30 to-transparent -translate-x-1/2" 
            />
            {/* Horizontal Center Line */}
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent -translate-x-1/2 -translate-y-1/2" 
            />
            {/* Central Node */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute top-1/2 left-1/2 w-4 h-4 bg-amber-500 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_20px_rgba(212,175,55,0.5)]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
            {advantages?.items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2, duration: 0.8 }}
                className="relative group flex flex-col md:flex-row items-start gap-6 md:gap-8"
              >
                {/* Icon Container */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-amber-500 group-hover:border-amber-500/50 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] transition-all duration-500">
                    {React.createElement(getIcon(item.icon), { size: 32, strokeWidth: 1.5 })}
                  </div>
                  {/* Connecting Line to Center (Visual only) */}
                  <div className={`hidden md:block absolute top-1/2 w-12 h-[1px] bg-white/5 -z-10 ${idx % 2 === 0 ? '-right-12' : '-left-12'}`} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-2xl font-serif font-bold mb-3 text-white group-hover:text-amber-500 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
