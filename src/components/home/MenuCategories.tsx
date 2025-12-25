import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useData } from '../../hooks/useData';

export const MenuCategories: React.FC = () => {
  const { menuCategories } = useData();

  return (
    <section id="menu" className="py-24 bg-black text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {menuCategories?.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="group relative h-[400px] md:h-[600px] overflow-hidden border-r border-white/10 last:border-r-0"
            >
              <div className="absolute inset-0">
                <img
                  src={category.image}
                  alt={category.title}
                  loading="lazy"
                  className={`w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-105 transform ${category.className || ''}`}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90" />
              </div>

              <div className="absolute inset-0 p-10 flex flex-col justify-end items-center text-center z-10">
                <h3 className="text-4xl font-serif font-bold mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  {category.title}
                </h3>
                <p className="text-amber-500 font-medium mb-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-75">
                  {category.subtitle}
                </p>
                <p className="text-white/70 mb-8 max-w-xs opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                  {category.description}
                </p>
                <a
                  href={category.link}
                  className="flex items-center gap-2 border border-white/30 px-8 py-3 uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 delay-200"
                >
                  <span>Выбрать заведение</span>
                  <ArrowRight size={16} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
