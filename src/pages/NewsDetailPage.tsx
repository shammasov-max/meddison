import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, ArrowLeft, Share2 } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { BookingModal } from '../components/ui/BookingModal';
import { GlowButton } from '../components/ui/GlowButton';
import { JsonLdInjector } from '../components/ui/JsonLdInjector';
import { useData } from '../hooks/useData';
import type { NewsItem } from '../types';

const SITE_URL = 'https://medisson-lounge.ru';

export const NewsDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const { news: allNews, seo, loading: isLoading } = useData();

  const newsItem = allNews.find((i) => i.slug === slug);

  // Get SEO data from admin settings (key: news_${slug})
  const seoKey = `news_${slug}`;
  const articleSeo = seo?.[seoKey];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [newsItem]);

  const handleShare = async () => {
    const shareData = {
      title: newsItem?.title,
      text: newsItem?.description,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShowCopiedToast(true);
        setTimeout(() => setShowCopiedToast(false), 2000);
      } catch (err) {
        console.log('Error copying to clipboard:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-serif mb-4">Загрузка...</h2>
        </div>
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-serif mb-4">Новость не найдена</h2>
          <Link to="/news" className="text-amber-500 hover:text-white transition-colors">
            Вернуться к списку новостей
          </Link>
        </div>
      </div>
    );
  }

  // SEO values with fallbacks to article defaults
  const title = articleSeo?.title || `${newsItem?.title} | Medisson Lounge`;
  const description = articleSeo?.description || newsItem?.description || '';
  // Ensure og:image is absolute URL for social crawlers
  const rawOgImage = articleSeo?.ogImage || newsItem?.image || '';
  const ogImage = rawOgImage.startsWith('http') ? rawOgImage : rawOgImage ? `${SITE_URL}${rawOgImage}` : '';

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:type" content={articleSeo?.ogType || 'article'} />
        <meta property="og:url" content={`${SITE_URL}/news/${slug}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <link rel="canonical" href={`${SITE_URL}/news/${slug}`} />
      </Helmet>
      <div className="bg-black min-h-screen text-white font-sans selection:bg-amber-500 selection:text-black relative">
        <JsonLdInjector
        pageKey={`news_${newsItem.slug}`}
        newsArticleData={{
          slug: newsItem.slug,
          title: newsItem.title,
          description: newsItem.description,
          date: newsItem.date,
          image: newsItem.image,
          fullContent: newsItem.fullContent,
          category: newsItem.category,
          location: newsItem.location
        }}
      />
      <Navbar onOpenBooking={() => setIsBookingOpen(true)} />

      {/* Toast Notification */}
      <div className={`fixed top-24 right-4 z-50 bg-zinc-900 border border-amber-500/50 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform ${showCopiedToast ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Ссылка скопирована</span>
        </div>
      </div>

      <article>
        {/* Hero Section */}
        <div className="relative h-[60vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={newsItem.image} 
              alt={newsItem.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          </div>

          <div className="absolute bottom-0 left-0 w-full p-4 pb-12 md:pb-20">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Link 
                  to="/news" 
                  className="inline-flex items-center gap-2 text-white/60 hover:text-amber-500 transition-colors mb-6 text-sm uppercase tracking-widest"
                >
                  <ArrowLeft size={16} />
                  Назад к новостям
                </Link>
                
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="px-3 py-1 bg-amber-500 text-black text-xs font-bold uppercase tracking-wider rounded-full">
                    {newsItem.category}
                  </span>
                </div>

                <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight max-w-4xl">
                  {newsItem.title}
                </h1>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Main Content */}
            <div className="lg:col-span-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                {/* Meta Info Bar */}
                <div className="flex flex-wrap items-center gap-6 text-white/50 text-sm border-b border-white/10 pb-8 mb-8">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-amber-500" />
                    {newsItem.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-amber-500" />
                    {newsItem.location}
                  </div>
                  <button 
                    className="flex items-center gap-2 ml-auto cursor-pointer hover:text-white transition-colors group" 
                    onClick={handleShare}
                  >
                    <Share2 size={16} className="group-hover:text-amber-500 transition-colors" />
                    Поделиться
                  </button>
                </div>

                {/* HTML Content */}
                <div 
                  className="prose prose-invert prose-lg max-w-none prose-headings:font-serif prose-headings:text-white prose-p:text-white/80 prose-a:text-amber-500 hover:prose-a:text-amber-400 prose-li:text-white/80 prose-strong:text-white"
                  dangerouslySetInnerHTML={{ __html: newsItem.fullContent || '' }}
                />
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              {/* CTA Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm"
              >
                <h3 className="text-2xl font-serif font-bold mb-4">Забронировать стол</h3>
                <p className="text-white/60 mb-6">
                  Хотите посетить это мероприятие или попробовать новое меню? Забронируйте столик заранее.
                </p>
                <div className="w-full" onClick={() => setIsBookingOpen(true)}>
                  <GlowButton className="w-full justify-center">
                    Забронировать
                  </GlowButton>
                </div>
              </motion.div>

              {/* Other News Preview */}
              <div className="pt-8 border-t border-white/10">
                <h4 className="text-lg font-serif font-bold mb-6">Другие новости</h4>
                <div className="space-y-6">
                  {allNews
                    .filter(item => item.id !== newsItem.id)
                    .slice(0, 3)
                    .map(item => (
                      <Link 
                        key={item.id} 
                        to={`/news/${item.slug}`}
                        className="group block flex gap-4 items-start"
                      >
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div>
                          <div className="text-xs text-amber-500 mb-1">{item.date}</div>
                          <h5 className="font-medium leading-snug group-hover:text-amber-500 transition-colors line-clamp-2">
                            {item.title}
                          </h5>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </article>

        <Footer />
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />
      </div>
    </>
  );
};
