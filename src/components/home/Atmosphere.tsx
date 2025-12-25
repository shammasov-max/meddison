import React from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../hooks/useData';

export const Atmosphere: React.FC = () => {
  const { atmosphere } = useData();

  return (
    <section id="atmosphere" className="py-24 bg-black text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-serif font-bold mb-4"
          >
            {atmosphere?.title}
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="w-24 h-1 bg-amber-500 mx-auto mb-6" 
          />
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-white/60 text-lg max-w-2xl mx-auto"
          >
            {atmosphere?.subtitle}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {atmosphere?.items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`group relative h-[400px] overflow-hidden rounded-xl cursor-pointer ${item.size === 'large' ? 'md:col-span-2 lg:col-span-2' : ''}`}
            >
              {/* Image Layer */}
              <img 
                src={item.image} 
                alt={item.title} 
                loading="lazy"
                className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${item.className || ''}`}
              />
              
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 group-hover:from-black group-hover:via-black/60 transition-all duration-500" />
              
              {/* Golden Border Frame */}
              <div className="absolute inset-4 border border-amber-500/50 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500" />

              {/* Content Layer */}
              <div className="absolute bottom-0 left-0 w-full p-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                <h3 className="text-2xl font-serif font-bold mb-2 text-white">
                  {item.title}
                </h3>
                <p className="text-amber-500/90 font-medium">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
