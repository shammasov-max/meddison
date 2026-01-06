import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Utensils, Navigation, Instagram, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { BookingModal } from '../components/ui/BookingModal';
import { BookingCTA } from '../components/home/BookingCTA';
import { GlowButton } from '../components/ui/GlowButton';
import { dataService } from '../services/dataService';
import { getIcon } from '../utils/iconResolver';
import type { Location } from '../types';
import { isDev, devTransition } from '../utils/animation';
import { useData } from '../hooks/useData';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

const SITE_URL = 'https://medisson-lounge.ru';

export const LocationPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get SEO data from admin settings
  const { data: siteData } = useData();
  const seoKey = `location_${slug}`;
  const seo = siteData?.seo?.[seoKey];

  // Helper to ensure absolute URL for og:image
  const getAbsoluteUrl = (url: string | undefined): string => {
    if (!url) return `${SITE_URL}/assets/images/og-image.jpg`;
    return url.startsWith('http') ? url : `${SITE_URL}${url}`;
  };

  useEffect(() => {
    const loadLocation = async () => {
      if (!slug) return;

      setIsLoading(true);
      await dataService.load();
      const data = dataService.getLocation(slug);
      if (data) {
        setLocation(data);
      } else {
        navigate('/');
      }
      setIsLoading(false);
    };
    loadLocation();
  }, [slug, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  if (isLoading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-white font-serif text-xl">
        Загрузка...
      </div>
    );
  }

  if (!location) return null;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % location.gallery.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + location.gallery.length) % location.gallery.length);
  };

  const mapLink = location.coordinates && location.coordinates.startsWith('http')
    ? location.coordinates
    : `https://yandex.ru/maps/?rtext=~${encodeURIComponent(location.address)}&rtt=auto`;

  // Format menu link: local paths (/...) stay as-is, external URLs get https:// if needed
  const menuLinkUrl = location.menuLink
    ? location.menuLink.startsWith('/') || location.menuLink.startsWith('http')
      ? location.menuLink
      : `https://${location.menuLink}`
    : null;

  // Format social links for location
  const formatInstagramUrl = (value: string | undefined) => {
    if (!value) return null;
    if (value.startsWith('http')) return value;
    const username = value.startsWith('@') ? value.slice(1) : value;
    return `https://instagram.com/${username}`;
  };

  const formatPhoneUrl = (value: string | undefined) => {
    if (!value) return null;
    // Format as tel: link, keep + for international format
    const phone = value.replace(/[^\d+]/g, '');
    return `tel:${phone}`;
  };

  const formatWhatsAppUrl = (value: string | undefined) => {
    if (!value) return null;
    if (value.startsWith('http')) return value;
    // Remove all non-digits for wa.me link
    const phone = value.replace(/[^\d]/g, '');
    return `https://wa.me/${phone}`;
  };

  const formatTelegramUrl = (value: string | undefined) => {
    if (!value) return null;
    if (value.startsWith('http')) return value;
    const username = value.startsWith('@') ? value.slice(1) : value;
    return `https://t.me/${username}`;
  };

  const instagramUrl = formatInstagramUrl(location.socialLinks?.instagram);
  const whatsappUrl = formatWhatsAppUrl(location.socialLinks?.whatsapp);
  const telegramUrl = formatTelegramUrl(location.socialLinks?.telegram);

  return (
    <>
      <Helmet>
        <title>{seo?.title || `${location.name} | Medisson Lounge`}</title>
        <meta name="description" content={seo?.description || location.description} />
        <meta property="og:type" content={seo?.ogType || 'place'} />
        <meta property="og:url" content={`${SITE_URL}/locations/${slug}`} />
        <meta property="og:title" content={seo?.title || `${location.name} | Medisson Lounge`} />
        <meta property="og:description" content={seo?.description || location.description} />
        <meta property="og:image" content={getAbsoluteUrl(seo?.ogImage || location.image)} />
        <link rel="canonical" href={`${SITE_URL}/locations/${slug}`} />
      </Helmet>
      <div className="bg-black min-h-screen text-white font-sans selection:bg-amber-500 selection:text-black">
        <Navbar onOpenBooking={() => setIsBookingOpen(true)} />
      
      <main>
        {/* Hero Section */}
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={location.image} 
              alt={location.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          {/* Back Button */}
          <div className="absolute top-24 left-4 md:left-10 z-20">
            <Link
              to="/"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:border-white/30"
            >
              <ArrowLeft size={14} />
              На главную
            </Link>
          </div>

          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <motion.div
              initial={isDev ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={devTransition({ duration: 0.8 })}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-6 text-white">
                {location.name}
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-10 font-light max-w-2xl mx-auto">
                {location.description}
              </p>
              
              <div className="flex flex-col items-center gap-8">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
                  <GlowButton onClick={() => setIsBookingOpen(true)}>
                    Забронировать стол
                  </GlowButton>
                  
                  {menuLinkUrl && (
                    <a
                      href={menuLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 backdrop-blur-md text-white/90 px-10 py-5 rounded-full font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300 border border-white/10 hover:border-white/30"
                    >
                      <Utensils size={18} />
                      Меню
                    </a>
                  )}

                  <a
                    href={mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500 hover:text-black backdrop-blur-md text-amber-500 px-10 py-5 rounded-full font-bold uppercase tracking-widest transition-all duration-300 border border-amber-500/30 hover:border-amber-500"
                  >
                    <Navigation size={18} />
                    Доехать
                  </a>
                </div>

                {/* Social Icons */}
                <div className="flex items-center gap-6">
                  {instagramUrl && (
                    <a href={instagramUrl!} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-amber-500 transition-colors p-3 hover:bg-white/10 rounded-full border border-transparent hover:border-white/10" title="Instagram">
                      <Instagram size={24} />
                    </a>
                  )}
                  {telegramUrl && (
                    <a href={telegramUrl!} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-amber-500 transition-colors p-3 hover:bg-white/10 rounded-full border border-transparent hover:border-white/10" title="Telegram">
                      <Send size={24} />
                    </a>
                  )}
                  {whatsappUrl && (
                    <a href={whatsappUrl!} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-amber-500 transition-colors p-3 hover:bg-white/10 rounded-full border border-transparent hover:border-white/10" title="WhatsApp">
                      <WhatsAppIcon className="w-6 h-6" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Info Bar (Compact & Animated Background) */}
        <section className="py-10 border-y border-white/5 relative overflow-hidden">
           {/* Background Image */}
           <div className="absolute inset-0 z-0">
             <img 
               src="/assets/images/smoke-1.jpg" 
               alt="Background" 
               className="w-full h-full object-cover opacity-50"
             />
             <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
           </div>

           {/* Animated Background Lines */}
           <div className="absolute inset-0 opacity-20 z-0">
             <motion.div 
               className="absolute inset-0"
               style={{
                 backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(245, 158, 11, 0.1) 20px, rgba(245, 158, 11, 0.1) 21px)'
               }}
               animate={{ backgroundPosition: ["0px 0px", "100px 100px"] }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             />
           </div>
           
           {/* Ambient Glow */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none z-0" />
           
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { 
                  icon: "MapPin", 
                  title: "Адрес", 
                  value: location.address, 
                  delay: 0 
                },
                { 
                  icon: "Clock", 
                  title: "Режим работы", 
                  value: location.hours, 
                  delay: 0.1 
                },
                { 
                  icon: "Phone", 
                  title: "Телефон", 
                  value: location.phone, 
                  delay: 0.2 
                }
              ].map((item, idx) => {
                // Address (idx=0) and Phone (idx=2) are clickable links
                const isLink = idx === 0 || idx === 2;
                const Component = isLink ? motion.a : motion.div;
                const linkProps = idx === 0 ? {
                  href: mapLink,
                  target: "_blank",
                  rel: "noopener noreferrer"
                } : idx === 2 ? {
                  href: formatPhoneUrl(location.phone),
                } : {};

                return (
                  <Component
                    key={idx}
                    {...linkProps}
                    initial={isDev ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={devTransition({ delay: item.delay, duration: 0.5 })}
                    className={`group relative p-6 rounded-xl border border-white/5 bg-zinc-900/40 backdrop-blur-md hover:bg-zinc-900/60 hover:border-amber-500/30 transition-all duration-500 flex flex-col items-center justify-center text-center min-h-[160px] ${isLink ? 'cursor-pointer' : ''}`}
                  >
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                  
                  {/* Icon */}
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                    <div className="relative w-12 h-12 mx-auto bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 group-hover:border-amber-500/50 group-hover:scale-110 transition-all duration-500 shadow-lg group-hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      {React.createElement(getIcon(item.icon), { 
                        size: 20, 
                        className: "text-white/80 group-hover:text-amber-500 transition-colors duration-500" 
                      })}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2 font-bold group-hover:text-amber-500/60 transition-colors duration-500">
                      {item.title}
                    </h3>
                    <p className="text-base md:text-lg font-serif font-medium text-white/90 group-hover:text-white transition-colors duration-500 leading-relaxed">
                      {item.value}
                    </p>
                  </div>
                </Component>
              );
              })}
            </div>
          </div>
        </section>

        {/* Description & Features (Compact Style) */}
        <section className="relative py-12 overflow-hidden">
          {/* Abstract Background */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/assets/images/location-butovo-bg-new.png" 
              alt="Background" 
              className="w-full h-full object-cover object-center opacity-30 grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Text Content */}
              <motion.div
                initial={isDev ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={devTransition({ duration: 0.8 })}
                className="lg:col-span-6 backdrop-blur-md bg-black/30 p-6 rounded-3xl border border-white/5 shadow-2xl"
              >
                <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-600">
                  О локации
                </h2>
                <div className="w-16 h-1 bg-amber-500 mb-6" />
                
                <div className="prose prose-invert prose-base text-white/80 mb-8 leading-relaxed font-light">
                  <p>{location.fullDescription}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {location.features?.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={isDev ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={devTransition({ delay: idx * 0.1 })}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/50 hover:bg-white/10 transition-all duration-500 group cursor-default"
                    >
                      <div className="p-2 bg-amber-500/20 rounded-full text-amber-400 group-hover:scale-110 group-hover:text-amber-300 transition-all duration-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0">
                        {React.createElement(getIcon(feature.icon), { size: 20 })}
                      </div>
                      <div>
                        <h4 className="font-bold text-base mb-0.5 text-white group-hover:text-amber-200 transition-colors leading-tight">{feature.title}</h4>
                        <p className="text-[10px] uppercase tracking-wider text-white/50 group-hover:text-white/70 transition-colors">{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              {/* Visual Composition */}
              <div className="lg:col-span-6 relative h-[400px] hidden lg:block">
                {/* Main Large Image */}
                <motion.div
                  initial={isDev ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={devTransition({ duration: 1 })}
                  className="absolute top-0 right-0 w-4/5 h-[320px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl z-10"
                >
                  <img 
                    src="/assets/images/location-butovo-interior-new.png" 
                    alt="Interior Atmosphere" 
                    className="w-full h-full object-cover object-center grayscale hover:scale-105 transition-transform duration-1000" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </motion.div>

                {/* Floating Detail Image */}
                <motion.div
                  initial={isDev ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, y: 50, x: -50 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true }}
                  transition={devTransition({ duration: 1, delay: 0.3 })}
                  className="absolute bottom-0 left-4 w-1/2 h-[240px] rounded-3xl overflow-hidden border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20"
                >
                  <img 
                    src="/assets/images/location-butovo-cocktail-new.jpg" 
                    alt="Detail" 
                    className="w-full h-full object-cover object-center hover:scale-110 transition-transform duration-1000" 
                  />
                </motion.div>

                {/* Decorative Elements */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute top-10 left-10 w-24 h-24 border border-amber-500/20 rounded-full z-0 border-dashed"
                />
                <div className="absolute bottom-10 right-10 w-48 h-48 bg-amber-500/10 blur-[80px] rounded-full z-0" />
              </div>

              {/* Mobile Image Fallback */}
              <div className="lg:hidden grid grid-cols-2 gap-3">
                 <img 
                    src="/assets/images/location-butovo-interior-new.png" 
                    alt="Interior" 
                    className="w-full h-48 object-cover object-center grayscale rounded-2xl" 
                  />
                  <img 
                    src="/assets/images/location-butovo-cocktail-new.jpg" 
                    alt="Detail" 
                    className="w-full h-48 object-cover object-center rounded-2xl" 
                  />
              </div>

            </div>
          </div>
        </section>

        {/* Gallery Slider */}
        <section className="relative py-24 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1672733887070-75373bc17feb?auto=format&fit=crop&w=1920&q=80" 
              alt="Background" 
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/50 to-black" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <motion.h2
                initial={isDev ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={devTransition({})}
                className="text-4xl md:text-6xl font-serif font-bold mb-4 text-amber-500"
              >
                Галерея
              </motion.h2>
              <motion.p
                initial={isDev ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={devTransition({ delay: 0.2 })}
                className="text-white/60 text-xl"
              >
                Интерьер и атмосфера
              </motion.p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/50 backdrop-blur-sm group">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentSlide}
                    src={location.gallery[currentSlide]}
                    alt={`Gallery ${currentSlide}`}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>

                {/* Navigation Buttons */}
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-amber-500 hover:text-black transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-amber-500 hover:text-black transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/10">
                  <motion.div 
                    className="h-full bg-amber-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((currentSlide + 1) / location.gallery.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex justify-center gap-3 mt-6 overflow-x-auto pb-2 px-4">
                {location.gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`relative w-16 h-12 md:w-20 md:h-14 rounded-md overflow-hidden transition-all duration-300 ${
                      currentSlide === idx 
                        ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-black scale-105 z-10 opacity-100' 
                        : 'opacity-40 hover:opacity-80 hover:scale-105'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover brightness-75 hover:brightness-100 transition-all duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <BookingCTA 
          image={location.image} 
          onOpenBooking={() => setIsBookingOpen(true)} 
        />
      </main>

        <Footer />
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          defaultLocation={location.name}
        />
      </div>
    </>
  );
};
