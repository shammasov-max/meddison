import React from 'react';
import { motion } from 'framer-motion';

export const LoyaltyLevels: React.FC = () => {
  const levels = [
    {
      name: "Silver",
      percent: "5%",
      condition: "При регистрации",
      color: "from-gray-400 to-gray-600",
      textColor: "text-gray-300",
      borderColor: "border-gray-500"
    },
    {
      name: "Gold",
      percent: "7%",
      condition: "От 150 000 ₽",
      color: "from-amber-300 to-amber-600",
      textColor: "text-amber-400",
      borderColor: "border-amber-500"
    },
    {
      name: "Platinum",
      percent: "10%",
      condition: "От 450 000 ₽",
      color: "from-slate-300 to-slate-500",
      textColor: "text-slate-300",
      borderColor: "border-slate-400"
    },
    {
      name: "Medisson Select",
      percent: "15%",
      condition: "От 1 000 000 ₽",
      color: "from-purple-400 to-purple-900",
      textColor: "text-purple-400",
      borderColor: "border-purple-500"
    }
  ];

  return (
    <section className="py-24 bg-black text-white relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-serif font-bold mb-4"
          >
            Уровни привилегий
          </motion.h2>
          <div className="w-24 h-1 bg-amber-500 mx-auto mb-6" />
          <p className="text-white/60 max-w-2xl mx-auto">
            Чем чаще вы нас посещаете, тем больше привилегий получаете. 
            Уровень карты повышается автоматически при достижении необходимой суммы накоплений.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
          {levels.map((level, index) => (
            <motion.div
              key={level.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative p-8 rounded-3xl 
                bg-gradient-to-b ${level.color}
                shadow-[0_10px_0_rgba(0,0,0,0.3),0_15px_20px_rgba(0,0,0,0.2)]
                active:shadow-[0_0_0_rgba(0,0,0,0.3),0_0_0_rgba(0,0,0,0.2)]
                active:translate-y-[10px]
                hover:-translate-y-1 hover:shadow-[0_12px_0_rgba(0,0,0,0.3),0_20px_25px_rgba(0,0,0,0.3)]
                transition-all duration-200 ease-out
                group cursor-pointer
                border-t border-white/20
              `}
            >
              {/* Inner bevel/highlight for 3D feel */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              
              {/* Dark overlay for contrast */}
              <div className="absolute inset-[2px] rounded-[22px] bg-black/80 backdrop-blur-sm" />

              <div className="relative z-10 flex flex-col h-full items-center text-center">
                {/* Percent with glow */}
                <div className={`
                  text-6xl font-black mb-2 
                  bg-gradient-to-b ${level.color} bg-clip-text text-transparent
                  drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]
                `}>
                  {level.percent}
                </div>
                
                <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-6 font-medium">Кэшбэк</div>
                
                <h3 className={`text-2xl font-serif font-bold mb-4 text-white group-hover:scale-105 transition-transform duration-300`}>
                  {level.name}
                </h3>
                
                <div className="mt-auto pt-6 border-t border-white/10 w-full">
                  <p className="text-sm text-white/60 font-medium">
                    {level.condition}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
