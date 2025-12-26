import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { isDev, devTransition } from '../../utils/animation';

export const Locations: React.FC = () => {
  const { locations } = useData();

  return (
    <section id="locations" className="py-24 bg-zinc-950 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Наши локации</h2>
          <div className="w-24 h-1 bg-white/20 mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {locations
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map((location, index) => {
            const isComingSoon = location.comingSoon === true;
            const Wrapper = isComingSoon ? 'div' : Link;
            const wrapperProps = isComingSoon ? {} : { to: `/lounge/${location.slug}` };

            return (
              <Wrapper 
                key={location.id} 
                {...wrapperProps} 
                className={`block h-full ${isComingSoon ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <motion.div
                  initial={isDev ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={devTransition({ delay: index * 0.2 })}
                  className={`group relative h-[500px] overflow-hidden rounded-2xl ${isComingSoon ? '' : 'cursor-pointer'}`}
                >
                  <div className="absolute inset-0">
                    <img
                      src={location.image}
                      alt={location.name}
                      loading="lazy"
                      className={`w-full h-full object-cover object-center transition-transform duration-700 ${isComingSoon ? 'grayscale-[0.3] scale-100' : 'group-hover:scale-110'}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 group-hover:from-black group-hover:via-black/60 transition-all duration-500" />
                    
                    {isComingSoon && (
                      <div className="absolute top-6 right-6 bg-amber-500 text-black px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wider z-10 shadow-lg">
                        Скоро открытие
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 p-8 flex flex-col justify-end items-start">
                    <h3 className={`text-3xl font-serif font-bold mb-2 ${isComingSoon ? 'text-white/90' : 'text-white'}`}>{location.name}</h3>
                    <p className={`mb-6 max-w-md ${isComingSoon ? 'text-white/60' : 'text-white/80'}`}>{location.description}</p>
                    
                    {!isComingSoon && (
                      <div className="flex items-center space-x-2 text-white border-b border-white/30 pb-1 group-hover:border-white transition-all duration-300">
                        <span className="uppercase tracking-widest text-sm">Подробнее</span>
                        <ArrowRight size={16} />
                      </div>
                    )}
                  </div>
                </motion.div>
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
};