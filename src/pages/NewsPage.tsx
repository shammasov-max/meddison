import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { BookingModal } from '../components/ui/BookingModal';
import { JsonLdInjector } from '../components/ui/JsonLdInjector';
import { useData } from '../hooks/useData';
import { isDev, devTransition } from '../utils/animation';

const SITE_URL = 'https://medisson-lounge.ru';

export const NewsPage = () => {
  const [filter, setFilter] = useState('Все');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const { news, seo, loading: isLoading } = useData();
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const categories = ['Все', 'Мероприятия', 'Меню', 'Акции'];

  const filteredNews = filter === 'Все' 
    ? news 
    : news.filter(item => item.category === filter);

  return (
    <>
      <Helmet>
        <title>{seo?.news?.title || 'Новости и события | Medisson Lounge'}</title>
        <meta name="description" content={seo?.news?.description || 'Афиша мероприятий, акции и новости сети Medisson Lounge.'} />
        <meta property="og:type" content={seo?.news?.ogType || 'website'} />
        <meta property="og:url" content={`${SITE_URL}/news`} />
        <meta property="og:title" content={seo?.news?.title || 'Новости и события | Medisson Lounge'} />
        <meta property="og:description" content={seo?.news?.description || 'Афиша мероприятий, акции и новости сети Medisson Lounge.'} />
        {seo?.news?.ogImage && <meta property="og:image" content={seo.news.ogImage} />}
        <link rel="canonical" href={`${SITE_URL}/news`} />
      </Helmet>
      <div className="bg-black min-h-screen text-white font-sans selection:bg-amber-500 selection:text-black">
        <JsonLdInjector pageKey="news" />
      <Navbar onOpenBooking={() => setIsBookingOpen(true)} />
      
      {/* Hero Header */}
      <section className="relative h-[35vh] sm:h-[40vh] md:h-[50vh] overflow-hidden border-b border-white/5">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/assets/images/news-hero-cover-celebration.jpg"
            alt="Festive celebration background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />
        </div>
        {/* Animated scan-lines with subtle parallax */}
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(120deg, rgba(245,158,11,0.06) 0px, rgba(245,158,11,0.06) 2px, transparent 2px, transparent 6px)',
            y: bgY,
          }}
          initial={isDev ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={devTransition({ duration: 1.2 })}
        />
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[150px] md:h-[200px] bg-amber-500/10 blur-[80px] md:blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col items-center justify-center text-center">
          <motion.h1
            initial={isDev ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={devTransition({ duration: 0.8 })}
            className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold mb-3 md:mb-4"
          >
            Новости и События
          </motion.h1>
          <motion.p
            initial={isDev ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={devTransition({ duration: 0.8, delay: 0.1 })}
            className="text-white/70 text-sm md:text-lg max-w-2xl mx-auto px-4"
          >
            Будьте в курсе всех мероприятий, новинок меню и специальных предложений Medisson Lounge.
          </motion.p>
        </div>
      </section>

      <main className="py-8 md:py-12 px-4 container mx-auto">

        {/* Filters */}
        <div className="flex justify-center mb-8 md:mb-12 overflow-x-auto pb-2">
          <div className="relative inline-flex items-center gap-0 bg-black/60 border border-white/10 rounded-full p-1 backdrop-blur-sm shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-0 rounded-full border border-white/5"
            />
            {categories.map((cat) => {
              const isActive = filter === cat;
              return (
                <motion.button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`relative px-3 sm:px-5 md:px-6 py-2 text-xs sm:text-sm md:text-base uppercase tracking-[0.15em] md:tracking-[0.2em] font-semibold transition-all duration-300 rounded-full touch-target whitespace-nowrap ${
                    isActive ? 'text-black' : 'text-white/60 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="categoryHighlight"
                      className="absolute inset-0 rounded-full bg-amber-500 shadow-[0_15px_40px_rgba(245,158,11,0.35)]"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{cat}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="text-center text-white/50 py-12">Загрузка новостей...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {filteredNews.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={isDev ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={devTransition({ delay: idx * 0.1 })}
                className="group bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 hover:border-amber-500/30 transition-all duration-500 hover:-translate-y-1 md:hover:-translate-y-2"
              >
                <Link to={`/news/${item.slug}`} className="block h-full flex flex-col">
                  <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
                    <img
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-amber-500 border border-amber-500/20">
                      {item.category}
                    </div>
                  </div>
                  
                  <div className="p-4 md:p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs text-white/40 mb-3 md:mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="md:w-[14px] md:h-[14px]" />
                        {item.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="md:w-[14px] md:h-[14px]" />
                        {item.location}
                      </div>
                    </div>
                    
                    <h3 className="text-lg md:text-xl font-serif font-bold mb-2 md:mb-3 group-hover:text-amber-500 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-white/60 text-xs md:text-sm leading-relaxed mb-4 md:mb-6 flex-grow line-clamp-3">
                      {item.description}
                    </p>
                    
                    <div className="text-amber-500 text-xs md:text-sm font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 group/btn mt-auto">
                      Подробнее <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>

        <Footer />
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />
      </div>
    </>
  );
};
