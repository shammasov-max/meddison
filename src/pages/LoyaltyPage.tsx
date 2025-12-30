import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { BookingModal } from '../components/ui/BookingModal';
import { Preloader } from '../components/ui/Preloader';
import { JsonLdInjector } from '../components/ui/JsonLdInjector';
import { LoyaltyIntro } from '../components/loyalty/LoyaltyIntro';
import { LoyaltyLevels } from '../components/loyalty/LoyaltyLevels';
import { LoyaltyCTA } from '../components/loyalty/LoyaltyCTA';
import { useData } from '../hooks/useData';

const SITE_URL = 'https://medisson-lounge.ru';

export const LoyaltyPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const { seo } = useData();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>{seo?.loyalty?.title || 'Программа лояльности | Medisson Lounge'}</title>
        <meta name="description" content={seo?.loyalty?.description || 'Программа лояльности Medisson Lounge. Накапливайте бонусы, повышайте уровень карты и получайте кэшбэк до 15%.'} />
        <meta property="og:type" content={seo?.loyalty?.ogType || 'website'} />
        <meta property="og:url" content={`${SITE_URL}/loyalty`} />
        <meta property="og:title" content={seo?.loyalty?.title || 'Программа лояльности | Medisson Lounge'} />
        <meta property="og:description" content={seo?.loyalty?.description || 'Программа лояльности Medisson Lounge. Накапливайте бонусы, повышайте уровень карты и получайте кэшбэк до 15%.'} />
        {seo?.loyalty?.ogImage && <meta property="og:image" content={seo.loyalty.ogImage} />}
        <link rel="canonical" href={`${SITE_URL}/loyalty`} />
      </Helmet>

      <JsonLdInjector pageKey="loyalty" />

      {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}
      
      <div className={`bg-black min-h-screen text-white font-sans selection:bg-amber-500 selection:text-black ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-1000'}`}>
        <Navbar onOpenBooking={() => setIsBookingOpen(true)} />
        
        <main className="pt-20">
          <LoyaltyIntro />
          <LoyaltyLevels />
          <LoyaltyCTA />
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
