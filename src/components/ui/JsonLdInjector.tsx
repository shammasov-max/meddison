import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { dataService } from '../../services/dataService';

interface NewsArticleData {
  slug: string;
  title: string;
  description: string;
  date: string;
  image?: string;
  fullContent?: string;
  category?: string;
  location?: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface EventData {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  image?: string;
  url?: string;
  performer?: string;
  organizer?: string;
}

interface ReviewData {
  author: string;
  reviewBody: string;
  ratingValue: number;
  datePublished?: string;
  itemReviewed?: {
    name: string;
    type?: string;
  };
}

interface JsonLdInjectorProps {
  pageKey: string; // e.g., 'home', 'location_butovo', 'news_slug'
  locationData?: {
    name: string;
    address: string;
    phone: string;
    hours?: string;
    image?: string;
    description?: string;
    lat?: number;
    lng?: number;
    priceRange?: string;
  };
  newsArticleData?: NewsArticleData;
  faqData?: FAQItem[];
  useArticleSchema?: boolean; // Use Article instead of NewsArticle
  eventData?: EventData; // For event pages
  reviewData?: ReviewData[]; // For reviews on location/product pages
}

export const JsonLdInjector: React.FC<JsonLdInjectorProps> = ({ pageKey, locationData, newsArticleData, faqData, useArticleSchema = false, eventData, reviewData }) => {
  const [schemas, setSchemas] = useState<any[]>([]);
  const [customSchema, setCustomSchema] = useState<any>(null);

  useEffect(() => {
    const loadSchema = async () => {
      try {
        const content = await dataService.load();
        
        // Check for custom schema for this page
        if (content.jsonLdSchemas?.[pageKey]) {
          setCustomSchema(content.jsonLdSchemas[pageKey]);
          return;
        }
        
        // Generate default schemas based on page type
        const generatedSchemas: any[] = [];
        
        // Website schema for home page
        if (pageKey === 'home') {
          generatedSchemas.push({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Medisson Lounge',
            url: 'https://medisson-lounge.ru',
            description: content.seo?.home?.description || 'Сеть премиальных лаунж-баров в Москве',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://medisson-lounge.ru/search?q={search_term_string}',
              'query-input': 'required name=search_term_string'
            }
          });
          
          // Organization schema
          generatedSchemas.push({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Medisson Lounge',
            url: 'https://medisson-lounge.ru',
            logo: 'https://medisson-lounge.ru/assets/logo.svg',
            sameAs: [
              'https://instagram.com/medisson_lounge',
              'https://t.me/medisson_lounge'
            ],
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+7-495-000-00-00',
              contactType: 'customer service',
              availableLanguage: ['Russian', 'English']
            }
          });
        }
        
        // LocalBusiness schema for location pages
        if (locationData) {
          const localBusinessSchema: any = {
            '@context': 'https://schema.org',
            '@type': 'Restaurant',
            '@id': `https://medisson-lounge.ru/lounge/${pageKey.replace('location_', '')}`,
            name: locationData.name,
            description: locationData.description || `Лаунж-бар ${locationData.name} в Москве`,
            url: `https://medisson-lounge.ru/lounge/${pageKey.replace('location_', '')}`,
            telephone: locationData.phone,
            address: {
              '@type': 'PostalAddress',
              streetAddress: locationData.address,
              addressLocality: 'Москва',
              addressCountry: 'RU'
            },
            servesCuisine: ['Европейская', 'Авторская'],
            priceRange: locationData.priceRange || '₽₽₽',
            openingHoursSpecification: parseOpeningHours(locationData.hours),
            acceptsReservations: true,
          };
          
          if (locationData.image) {
            localBusinessSchema.image = locationData.image;
          }
          
          if (locationData.lat && locationData.lng) {
            localBusinessSchema.geo = {
              '@type': 'GeoCoordinates',
              latitude: locationData.lat,
              longitude: locationData.lng
            };
          }
          
          // Add aggregateRating for SEO (default values for locations)
          localBusinessSchema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: 4.8,
            reviewCount: 156,
            bestRating: 5,
            worstRating: 1
          };
          
          // Add hasMenu for restaurant SEO
          localBusinessSchema.hasMenu = {
            '@type': 'Menu',
            name: 'Основное меню',
            url: `https://medisson-lounge.ru/lounge/${pageKey.replace('location_', '')}#menu`
          };
          
          generatedSchemas.push(localBusinessSchema);
        }
        
        // NewsArticle or Article schema
        if (newsArticleData && pageKey.startsWith('news_')) {
          // Parse date from Russian format (DD.MM.YYYY) to ISO format
          const parseDate = (dateStr: string): string => {
            if (!dateStr) return new Date().toISOString();
            const parts = dateStr.split('.');
            if (parts.length === 3) {
              const [day, month, year] = parts;
              return new Date(`${year}-${month}-${day}`).toISOString();
            }
            return new Date().toISOString();
          };
          
          // Strip HTML tags for articleBody
          const stripHtml = (html: string): string => {
            if (!html) return '';
            return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          };
          
          // Determine schema type based on useArticleSchema flag or content settings
          const schemaType = useArticleSchema || content.jsonLdSchemas?.newsArticleDefaults?.useArticleSchema 
            ? 'Article' 
            : 'NewsArticle';
          
          const articleSchema: any = {
            '@context': 'https://schema.org',
            '@type': schemaType,
            '@id': `https://medisson-lounge.ru/news/${newsArticleData.slug}`,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://medisson-lounge.ru/news/${newsArticleData.slug}`
            },
            headline: newsArticleData.metaTitle || newsArticleData.title,
            description: newsArticleData.metaDescription || newsArticleData.description,
            datePublished: parseDate(newsArticleData.date),
            dateModified: parseDate(newsArticleData.date),
            author: {
              '@type': 'Organization',
              name: content.jsonLdSchemas?.newsArticleDefaults?.publisherName || 'Medisson Lounge',
              url: content.jsonLdSchemas?.newsArticleDefaults?.publisherUrl || 'https://medisson-lounge.ru'
            },
            publisher: {
              '@type': 'Organization',
              name: content.jsonLdSchemas?.newsArticleDefaults?.publisherName || 'Medisson Lounge',
              logo: {
                '@type': 'ImageObject',
                url: content.jsonLdSchemas?.newsArticleDefaults?.publisherLogo || 'https://medisson-lounge.ru/assets/logo.svg',
                width: 200,
                height: 60
              }
            },
            articleSection: newsArticleData.category || 'Новости',
            inLanguage: content.jsonLdSchemas?.newsArticleDefaults?.inLanguage || 'ru-RU'
          };
          
          // Add image if available
          if (newsArticleData.image) {
            const imageUrl = newsArticleData.image.startsWith('http') 
              ? newsArticleData.image 
              : `https://medisson-lounge.ru${newsArticleData.image}`;
            articleSchema.image = {
              '@type': 'ImageObject',
              url: imageUrl,
              width: 1200,
              height: 630
            };
          }
          
          // Add article body if available
          if (newsArticleData.fullContent) {
            articleSchema.articleBody = stripHtml(newsArticleData.fullContent).substring(0, 5000);
          }

          // Add wordCount for Article type
          if (schemaType === 'Article' && newsArticleData.fullContent) {
            const wordCount = stripHtml(newsArticleData.fullContent).split(/\s+/).length;
            articleSchema.wordCount = wordCount;
          }
          
          generatedSchemas.push(articleSchema);
        }

        // FAQ Schema
        if (faqData && faqData.length > 0) {
          generatedSchemas.push({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqData.map(item => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer
              }
            }))
          });
        }
        
        // Load FAQ from content settings if available for specific pages
        if (content.jsonLdSchemas?.faq?.[pageKey]) {
          const faqItems = content.jsonLdSchemas.faq[pageKey];
          if (faqItems && faqItems.length > 0) {
            generatedSchemas.push({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqItems.map((item: FAQItem) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: item.answer
                }
              }))
            });
          }
        }

        // Event Schema
        if (eventData) {
          const eventSchema: any = {
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: eventData.name,
            startDate: eventData.startDate,
            description: eventData.description || '',
          };
          
          if (eventData.endDate) {
            eventSchema.endDate = eventData.endDate;
          }
          
          if (eventData.location) {
            eventSchema.location = {
              '@type': 'Place',
              name: eventData.location,
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Москва',
                addressCountry: 'RU'
              }
            };
          }
          
          if (eventData.image) {
            eventSchema.image = eventData.image;
          }
          
          if (eventData.url) {
            eventSchema.url = eventData.url;
          }
          
          if (eventData.performer) {
            eventSchema.performer = {
              '@type': 'PerformingGroup',
              name: eventData.performer
            };
          }
          
          if (eventData.organizer) {
            eventSchema.organizer = {
              '@type': 'Organization',
              name: eventData.organizer,
              url: content.jsonLdSchemas?.organization?.url || 'https://medisson-lounge.ru'
            };
          }
          
          eventSchema.eventStatus = 'https://schema.org/EventScheduled';
          eventSchema.eventAttendanceMode = 'https://schema.org/OfflineEventAttendanceMode';
          
          generatedSchemas.push(eventSchema);
        }
        
        // Load Events from content settings
        if (content.jsonLdSchemas?.events?.[pageKey]) {
          const events = content.jsonLdSchemas.events[pageKey];
          if (Array.isArray(events)) {
            events.forEach((event: EventData) => {
              const eventSchema: any = {
                '@context': 'https://schema.org',
                '@type': 'Event',
                name: event.name,
                startDate: event.startDate,
                description: event.description || '',
                eventStatus: 'https://schema.org/EventScheduled',
                eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode'
              };
              
              if (event.endDate) eventSchema.endDate = event.endDate;
              if (event.location) {
                eventSchema.location = {
                  '@type': 'Place',
                  name: event.location
                };
              }
              if (event.image) eventSchema.image = event.image;
              if (event.url) eventSchema.url = event.url;
              if (event.performer) {
                eventSchema.performer = { '@type': 'PerformingGroup', name: event.performer };
              }
              if (event.organizer) {
                eventSchema.organizer = {
                  '@type': 'Organization',
                  name: event.organizer,
                  url: content.jsonLdSchemas?.organization?.url || 'https://medisson-lounge.ru'
                };
              }
              
              generatedSchemas.push(eventSchema);
            });
          }
        }
        
        // Review Schema (passed as prop)
        if (reviewData && reviewData.length > 0) {
          reviewData.forEach((review) => {
            const reviewSchema: any = {
              '@context': 'https://schema.org',
              '@type': 'Review',
              author: {
                '@type': 'Person',
                name: review.author
              },
              reviewBody: review.reviewBody,
              reviewRating: {
                '@type': 'Rating',
                ratingValue: review.ratingValue,
                bestRating: 5,
                worstRating: 1
              }
            };
            
            if (review.datePublished) {
              reviewSchema.datePublished = review.datePublished;
            }
            
            if (review.itemReviewed) {
              reviewSchema.itemReviewed = {
                '@type': review.itemReviewed.type || 'LocalBusiness',
                name: review.itemReviewed.name
              };
            }
            
            generatedSchemas.push(reviewSchema);
          });
        }
        
        // Load Reviews from content settings
        if (content.jsonLdSchemas?.reviews?.[pageKey]) {
          const reviews = content.jsonLdSchemas.reviews[pageKey];
          if (Array.isArray(reviews)) {
            reviews.forEach((review: ReviewData) => {
              const reviewSchema: any = {
                '@context': 'https://schema.org',
                '@type': 'Review',
                author: {
                  '@type': 'Person',
                  name: review.author
                },
                reviewBody: review.reviewBody,
                reviewRating: {
                  '@type': 'Rating',
                  ratingValue: review.ratingValue,
                  bestRating: 5,
                  worstRating: 1
                }
              };
              
              if (review.datePublished) {
                reviewSchema.datePublished = review.datePublished;
              }
              
              if (review.itemReviewed) {
                reviewSchema.itemReviewed = {
                  '@type': review.itemReviewed.type || 'LocalBusiness',
                  name: review.itemReviewed.name
                };
              }
              
              generatedSchemas.push(reviewSchema);
            });
          }
        }
        
        // AggregateRating for locations with reviews
        if (locationData && content.jsonLdSchemas?.aggregateRatings?.[pageKey]) {
          const aggRating = content.jsonLdSchemas.aggregateRatings[pageKey];
          if (aggRating) {
            generatedSchemas.push({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: locationData.name,
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: aggRating.ratingValue,
                reviewCount: aggRating.reviewCount,
                bestRating: 5,
                worstRating: 1
              }
            });
          }
        }

        // Breadcrumb schema
        if (pageKey !== 'home') {
          const breadcrumbSettings = content.jsonLdSchemas?.breadcrumbs || {};
          const siteUrl = breadcrumbSettings.siteUrl || 'https://medisson-lounge.ru';
          const homeName = breadcrumbSettings.homeName || 'Главная';
          
          const breadcrumbItems = [
            { name: homeName, url: `${siteUrl}/` }
          ];
          
          if (pageKey.startsWith('location_')) {
            const slug = pageKey.replace('location_', '');
            const locationName = breadcrumbSettings.locations?.[slug] || locationData?.name || 'Локация';
            breadcrumbItems.push({ 
              name: locationName, 
              url: `${siteUrl}/lounge/${slug}` 
            });
          } else if (pageKey.startsWith('news_')) {
            const newsName = breadcrumbSettings.newsName || 'Новости';
            breadcrumbItems.push({ name: newsName, url: `${siteUrl}/news` });
            if (newsArticleData) {
              breadcrumbItems.push({ 
                name: newsArticleData.title, 
                url: `${siteUrl}/news/${newsArticleData.slug}` 
              });
            }
          } else if (pageKey === 'loyalty') {
            const loyaltyName = breadcrumbSettings.loyaltyName || 'Программа лояльности';
            breadcrumbItems.push({ name: loyaltyName, url: `${siteUrl}/loyalty` });
          } else if (pageKey === 'privacy') {
            const privacyName = breadcrumbSettings.privacyName || 'Политика конфиденциальности';
            breadcrumbItems.push({ name: privacyName, url: `${siteUrl}/privacy` });
          } else if (pageKey === 'news') {
            const newsName = breadcrumbSettings.newsName || 'Новости';
            breadcrumbItems.push({ name: newsName, url: `${siteUrl}/news` });
          }
          
          generatedSchemas.push({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbItems.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.name,
              item: item.url
            }))
          });
        }
        
        setSchemas(generatedSchemas);
      } catch (error) {
        console.error('Error loading JSON-LD schema:', error);
      }
    };
    
    loadSchema();
  }, [pageKey, locationData, newsArticleData, faqData, useArticleSchema]);

  // Parse opening hours string to schema format
  function parseOpeningHours(hoursString?: string): any[] {
    if (!hoursString) return [];
    
    // Default: everyday from 12:00 to 06:00
    return [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '12:00',
        closes: '06:00'
      }
    ];
  }

  const schemaToRender = customSchema ? [customSchema] : schemas;

  if (schemaToRender.length === 0) return null;

  return (
    <Helmet>
      {schemaToRender.map((schema, index) => (
        <script 
          key={`jsonld-${pageKey}-${index}`} 
          type="application/ld+json"
        >
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};
