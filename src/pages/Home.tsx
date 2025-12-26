import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../components/layout/Navbar';
import { Hero } from '../components/home/Hero';
import { About } from '../components/home/About';
import { Advantages } from '../components/home/Advantages';
import { MenuCategories } from '../components/home/MenuCategories';
import { Locations } from '../components/home/Locations';
import { Atmosphere } from '../components/home/Atmosphere';
import { Footer } from '../components/layout/Footer';
import { BookingModal } from '../components/ui/BookingModal';
import { Preloader } from '../components/ui/Preloader';
import { JsonLdInjector } from '../components/ui/JsonLdInjector';
import { useData } from '../hooks/useData';
import { showPreloader } from '../utils/animation';

export const Home = () => {
  const [isLoading, setIsLoading] = useState(showPreloader);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const { seo } = useData();

  return (
    <>
      <Helmet>
        <title>{seo?.home?.title || 'Medisson Lounge — премиальный лаунж-бар в Москве'}</title>
        <meta name="description" content={seo?.home?.description || 'Сеть премиальных лаунж-баров Medisson в Москве. Авторская кухня, эксклюзивная кальянная карта и уютная атмосфера. Забронируйте столик!'} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://medisson-lounge.ru/" />
        <meta property="og:title" content={seo?.home?.title || 'Medisson Lounge — премиальный лаунж-бар в Москве'} />
        <meta property="og:description" content={seo?.home?.description || 'Сеть премиальных лаунж-баров Medisson. Авторская кухня и кальянная карта.'} />
        <meta property="og:image" content="https://medisson-lounge.ru/assets/images/og-image.jpg" />
        <meta property="og:locale" content="ru_RU" />
        <meta property="og:site_name" content="Medisson Lounge" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo?.home?.title || 'Medisson Lounge — премиальный лаунж-бар в Москве'} />
        <meta name="twitter:description" content={seo?.home?.description || 'Сеть премиальных лаунж-баров Medisson.'} />
        <meta name="twitter:image" content="https://medisson-lounge.ru/assets/images/og-image.jpg" />

        <link rel="canonical" href="https://medisson-lounge.ru/" />
      </Helmet>
      
      <JsonLdInjector pageKey="home" />

      {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}
      
      <div className={`bg-black min-h-screen text-white font-sans selection:bg-amber-500 selection:text-black ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-1000'}`}>
        <Navbar onOpenBooking={() => setIsBookingOpen(true)} />
        
        <main>
          <Hero onOpenBooking={() => setIsBookingOpen(true)} />
          <About />
          <Advantages />
          <MenuCategories />
          <Locations />
          <Atmosphere />
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
