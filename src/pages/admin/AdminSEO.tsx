import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { GlowButton } from '../../components/ui/GlowButton'
import { ImageUpload } from '../../components/ui/ImageUpload';
import { Save, Search, Globe, MapPin, Newspaper, FileText, Gift, ChevronDown, ChevronUp, Image, Share2, Settings, RefreshCw, Upload, Code, Building2, Phone, Clock, MapPinned, DollarSign, Plus, Trash2, Eye, Calendar, Star, User, BarChart3, Activity } from 'lucide-react';

interface SEOData {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: string;
}

interface RobotsConfig {
  allowAll: boolean;
  disallowPaths: string[];
  crawlDelay: number;
}

interface TrackingConfig {
  yandexMetrika: string;
  googleSearchConsole: string;
  googleAnalytics: string;
  customHeadScripts: string;
}

interface AllSEOData {
  [key: string]: SEOData;
}

const SITE_URL = 'https://medisson-lounge.ru';

export const AdminSEO = () => {
  const [seoData, setSeoData] = useState<AllSEOData>({});
  const [locations, setLocations] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'pages' | 'schema' | 'sitemap' | 'robots' | 'tracking'>('pages');
  const [trackingConfig, setTrackingConfig] = useState<TrackingConfig>({
    yandexMetrika: '',
    googleSearchConsole: '',
    googleAnalytics: '',
    customHeadScripts: ''
  });
  const [jsonLdSchemas, setJsonLdSchemas] = useState<{[key: string]: any}>({});
  const [selectedSchemaPage, setSelectedSchemaPage] = useState<string>('organization');
  const [schemaPreview, setSchemaPreview] = useState<string>('');
  const [robotsConfig, setRobotsConfig] = useState<RobotsConfig>({
    allowAll: true,
    disallowPaths: ['/admin', '/api'],
    crawlDelay: 1
  });
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    static: true,
    locations: false,
    news: false
  });

  useEffect(() => {
    const loadData = async () => {
      const content = await dataService.load();

      const initialSeo: AllSEOData = {
        home: content.seo?.home || { title: 'Medisson Lounge | Премиальный отдых в Москве', description: 'Сеть премиальных лаунж-баров в Москве.', ogImage: '', ogType: 'website' },
        news: content.seo?.news || { title: 'Новости и события | Medisson Lounge', description: 'Афиша мероприятий и акции.', ogImage: '', ogType: 'website' },
        locations: content.seo?.locations || { title: 'Наши локации | Medisson Lounge', description: 'Адреса лаунж-баров Medisson.', ogImage: '', ogType: 'website' },
        privacy: content.seo?.privacy || { title: 'Политика конфиденциальности | Medisson Lounge', description: 'Политика конфиденциальности.', ogImage: '', ogType: 'article' },
        loyalty: content.seo?.loyalty || { title: 'Программа лояльности | Medisson Lounge', description: 'Программа лояльности для гостей.', ogImage: '', ogType: 'website' },
      };

      // Load robots config
      if ((content as any).robotsConfig) {
        setRobotsConfig((content as any).robotsConfig);
      }

      // Load tracking config
      if ((content as any).trackingConfig) {
        setTrackingConfig((content as any).trackingConfig);
      }

      // Load JSON-LD schemas
      if ((content as any).jsonLdSchemas) {
        setJsonLdSchemas((content as any).jsonLdSchemas);
      } else {
        // Initialize with default Organization schema
        setJsonLdSchemas({
          organization: {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Medisson Lounge',
            url: 'https://medisson-lounge.ru',
            logo: 'https://medisson-lounge.ru/assets/logo.svg',
            description: 'Сеть премиальных лаунж-баров в Москве',
            telephone: '+7-495-000-00-00',
            email: 'info@medisson-lounge.ru',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Москва',
              addressCountry: 'RU'
            },
            sameAs: [
              'https://instagram.com/medisson_lounge',
              'https://t.me/medisson_lounge'
            ]
          }
        });
      }

      const locationsData = content.locations;
      setLocations(locationsData);

      locationsData.forEach((loc: any) => {
        const key = `location_${loc.slug}`;
        initialSeo[key] = content.seo?.[key] || {
          title: `${loc.name} | Medisson Lounge`,
          description: loc.description || `Лаунж-бар ${loc.name} в Москве.`,
          ogImage: loc.image || '',
          ogType: 'place'
        };
      });

      const newsData = content.news;
      setNews(newsData);

      newsData.forEach((article: any) => {
        const key = `news_${article.slug}`;
        initialSeo[key] = content.seo?.[key] || {
          title: `${article.title} | Medisson Lounge`,
          description: article.description || article.title,
          ogImage: article.image || '',
          ogType: 'article'
        };
      });

      setSeoData(initialSeo);
    };
    loadData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch('https://backend.youware.com/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'seo', value: seoData })
      });
      
      await fetch('https://backend.youware.com/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'robotsConfig', value: robotsConfig })
      });
      
      await fetch('https://backend.youware.com/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'jsonLdSchemas', value: jsonLdSchemas })
      });
      
      await fetch('https://backend.youware.com/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'trackingConfig', value: trackingConfig })
      });
      
      window.dispatchEvent(new Event('content-updated'));
      alert('SEO настройки сохранены!');
    } catch (error) {
      console.error('Error saving SEO:', error);
      alert('Ошибка сохранения');
    }
    setIsSaving(false);
  };

  const updateSEO = (key: string, field: keyof SEOData, value: string) => {
    setSeoData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const generateSitemap = () => {
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/news', priority: '0.8', changefreq: 'daily' },
      { url: '/privacy', priority: '0.3', changefreq: 'monthly' },
      { url: '/loyalty', priority: '0.6', changefreq: 'weekly' },
    ];

    const locationPages = locations.map(loc => ({
      url: `/lounge/${loc.slug}`,
      priority: '0.9',
      changefreq: 'weekly'
    }));

    const newsPages = news.map(article => ({
      url: `/news/${article.slug}`,
      priority: '0.7',
      changefreq: 'monthly'
    }));

    const allPages = [...staticPages, ...locationPages, ...newsPages];
    const today = new Date().toISOString().split('T')[0];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return xml;
  };

  const generateRobotsTxt = () => {
    let content = `# Robots.txt for Medisson Lounge
# Generated: ${new Date().toISOString()}

User-agent: *
`;

    if (robotsConfig.allowAll) {
      content += 'Allow: /\n';
    }

    robotsConfig.disallowPaths.forEach(path => {
      content += `Disallow: ${path}\n`;
    });

    if (robotsConfig.crawlDelay > 0) {
      content += `\nCrawl-delay: ${robotsConfig.crawlDelay}\n`;
    }

    content += `\n# Sitemap
Sitemap: ${SITE_URL}/sitemap.xml

# Social media bots
User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /
`;

    return content;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Скопировано в буфер обмена!');
  };

  const renderSEOCard = (
    key: string,
    label: string,
    url: string,
    icon: React.ReactNode
  ) => (
    <div key={key} className="bg-zinc-900 p-5 rounded-xl border border-white/5">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
        {icon}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{label}</h3>
          <p className="text-xs text-white/40 truncate">{url}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Meta Title */}
        <div>
          <label className="block text-sm text-white/50 mb-1">Meta Title</label>
          <div className="relative">
            <input
              type="text"
              value={seoData[key]?.title || ''}
              onChange={(e) => updateSEO(key, 'title', e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 pl-10 text-white text-sm focus:border-amber-500 outline-none"
              placeholder="Заголовок страницы"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          </div>
          <p className="text-xs text-white/30 mt-1">
            {(seoData[key]?.title || '').length}/60
          </p>
        </div>

        {/* Meta Description */}
        <div>
          <label className="block text-sm text-white/50 mb-1">Meta Description</label>
          <textarea
            value={seoData[key]?.description || ''}
            onChange={(e) => updateSEO(key, 'description', e.target.value)}
            className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none h-16 resize-none"
            placeholder="Описание для поисковиков"
          />
          <p className="text-xs text-white/30 mt-1">
            {(seoData[key]?.description || '').length}/160
          </p>
        </div>

        {/* OG Image Upload */}
        <div>
          <label className="block text-sm text-white/50 mb-2 flex items-center gap-2">
            <Upload size={14} /> OG Image
          </label>
          <ImageUpload
            value={seoData[key]?.ogImage || ''}
            onChange={(url) => updateSEO(key, 'ogImage', url)}
            folder="seo"
            placeholder="Загрузить OG изображение (1200x630)"
          />
        </div>

        {/* OG Type */}
        <div>
          <label className="block text-sm text-white/50 mb-1">OG Type</label>
          <select
            value={seoData[key]?.ogType || 'website'}
            onChange={(e) => updateSEO(key, 'ogType', e.target.value)}
            className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
          >
            <option value="website">website</option>
            <option value="article">article</option>
            <option value="place">place</option>
            <option value="product">product</option>
          </select>
        </div>

        {/* Social Preview */}
        <div className="bg-zinc-800 p-3 rounded-lg">
          <p className="text-xs text-white/50 mb-2 flex items-center gap-1">
            <Share2 size={12} /> Превью в соцсетях
          </p>
          <div className="bg-white rounded overflow-hidden">
            {seoData[key]?.ogImage && (
              <div className="h-32 bg-gray-200 flex items-center justify-center">
                <img src={seoData[key]?.ogImage} alt="OG Preview" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            <div className="p-2">
              <p className="text-[#1877f2] text-xs uppercase">{new URL(url).hostname}</p>
              <p className="text-black text-sm font-semibold truncate">{seoData[key]?.title || 'Заголовок'}</p>
              <p className="text-gray-500 text-xs line-clamp-2">{seoData[key]?.description || 'Описание'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const staticPages = [
    { key: 'home', label: 'Главная', url: `${SITE_URL}/`, icon: <Globe className="text-amber-500" size={18} /> },
    { key: 'news', label: 'Новости', url: `${SITE_URL}/news`, icon: <Newspaper className="text-blue-500" size={18} /> },
    { key: 'privacy', label: 'Политика конфиденциальности', url: `${SITE_URL}/privacy`, icon: <FileText className="text-gray-500" size={18} /> },
    { key: 'loyalty', label: 'Лояльность', url: `${SITE_URL}/loyalty`, icon: <Gift className="text-purple-500" size={18} /> },
  ];

  return (
    <div className="text-white max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">SEO Настройки</h1>
          <p className="text-white/50 mt-1">OG теги, Sitemap, Robots.txt</p>
        </div>
        <GlowButton onClick={handleSave} disabled={isSaving}>
          <Save size={18} className="mr-2" />
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </GlowButton>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { id: 'pages', label: 'Страницы', icon: Globe },
          { id: 'tracking', label: 'Аналитика', icon: BarChart3 },
          { id: 'schema', label: 'JSON-LD Schema', icon: Code },
          { id: 'sitemap', label: 'Sitemap', icon: RefreshCw },
          { id: 'robots', label: 'Robots.txt', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === tab.id 
                ? 'bg-amber-500 text-black' 
                : 'bg-zinc-800 text-white/70 hover:bg-zinc-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <>
          {/* Static Pages */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('static')}
              className="w-full flex items-center justify-between bg-zinc-800 px-4 py-3 rounded-lg mb-3"
            >
              <div className="flex items-center gap-3">
                <Globe className="text-amber-500" size={20} />
                <span className="font-medium">Основные страницы</span>
                <span className="text-white/40 text-sm">({staticPages.length})</span>
              </div>
              {expandedSections.static ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.static && (
              <div className="grid md:grid-cols-2 gap-4">
                {staticPages.map(page => renderSEOCard(page.key, page.label, page.url, page.icon))}
              </div>
            )}
          </div>

          {/* Locations */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('locations')}
              className="w-full flex items-center justify-between bg-zinc-800 px-4 py-3 rounded-lg mb-3"
            >
              <div className="flex items-center gap-3">
                <MapPin className="text-green-500" size={20} />
                <span className="font-medium">Локации</span>
                <span className="text-white/40 text-sm">({locations.length})</span>
              </div>
              {expandedSections.locations ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.locations && (
              <div className="grid md:grid-cols-2 gap-4">
                {locations.map(loc => renderSEOCard(
                  `location_${loc.slug}`,
                  loc.name,
                  `${SITE_URL}/lounge/${loc.slug}`,
                  <MapPin className="text-green-500" size={18} />
                ))}
              </div>
            )}
          </div>

          {/* News */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('news')}
              className="w-full flex items-center justify-between bg-zinc-800 px-4 py-3 rounded-lg mb-3"
            >
              <div className="flex items-center gap-3">
                <Newspaper className="text-blue-500" size={20} />
                <span className="font-medium">Новости</span>
                <span className="text-white/40 text-sm">({news.length})</span>
              </div>
              {expandedSections.news ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.news && (
              <div className="grid md:grid-cols-2 gap-4">
                {news.map(article => renderSEOCard(
                  `news_${article.slug}`,
                  article.title,
                  `${SITE_URL}/news/${article.slug}`,
                  <Newspaper className="text-blue-500" size={18} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* JSON-LD Schema Tab */}
      {activeTab === 'schema' && (
        <div className="space-y-6">
          {/* Schema Type Selector */}
          <div className="bg-zinc-900 p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-white/50">Тип схемы:</span>
              {[
                { id: 'organization', label: 'Организация', icon: Building2 },
                { id: 'newsArticle', label: 'Статьи (Article/News)', icon: Newspaper },
                { id: 'breadcrumbs', label: 'Хлебные крошки', icon: ChevronDown },
                { id: 'faq', label: 'FAQ', icon: FileText },
                { id: 'events', label: 'События', icon: Calendar },
                { id: 'reviews', label: 'Отзывы', icon: Star },
                ...locations.map(loc => ({ id: `location_${loc.slug}`, label: loc.name, icon: MapPin }))
              ].map(schema => (
                <button
                  key={schema.id}
                  onClick={() => setSelectedSchemaPage(schema.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
                    selectedSchemaPage === schema.id
                      ? 'bg-amber-500 text-black'
                      : 'bg-zinc-800 text-white/70 hover:bg-zinc-700'
                  }`}
                >
                  <schema.icon size={14} />
                  {schema.label}
                </button>
              ))}
            </div>
          </div>

          {/* Organization Schema Editor */}
          {selectedSchemaPage === 'organization' && (
            <div className="bg-zinc-900 p-6 rounded-xl border border-white/5">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                <Building2 size={20} className="text-amber-500" />
                Organization Schema
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/50 mb-1">Название организации</label>
                    <input
                      type="text"
                      value={jsonLdSchemas.organization?.name || ''}
                      onChange={(e) => setJsonLdSchemas(prev => ({
                        ...prev,
                        organization: { ...prev.organization, name: e.target.value }
                      }))}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/50 mb-1">URL сайта</label>
                    <input
                      type="text"
                      value={jsonLdSchemas.organization?.url || ''}
                      onChange={(e) => setJsonLdSchemas(prev => ({
                        ...prev,
                        organization: { ...prev.organization, url: e.target.value }
                      }))}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/50 mb-1">Описание</label>
                    <textarea
                      value={jsonLdSchemas.organization?.description || ''}
                      onChange={(e) => setJsonLdSchemas(prev => ({
                        ...prev,
                        organization: { ...prev.organization, description: e.target.value }
                      }))}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none h-20 resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/50 mb-1 flex items-center gap-2">
                      <Phone size={14} /> Телефон
                    </label>
                    <input
                      type="text"
                      value={jsonLdSchemas.organization?.telephone || ''}
                      onChange={(e) => setJsonLdSchemas(prev => ({
                        ...prev,
                        organization: { ...prev.organization, telephone: e.target.value }
                      }))}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                      placeholder="+7-495-000-00-00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/50 mb-1">Email</label>
                    <input
                      type="email"
                      value={jsonLdSchemas.organization?.email || ''}
                      onChange={(e) => setJsonLdSchemas(prev => ({
                        ...prev,
                        organization: { ...prev.organization, email: e.target.value }
                      }))}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                      placeholder="info@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/50 mb-1">URL логотипа</label>
                    <input
                      type="text"
                      value={jsonLdSchemas.organization?.logo || ''}
                      onChange={(e) => setJsonLdSchemas(prev => ({
                        ...prev,
                        organization: { ...prev.organization, logo: e.target.value }
                      }))}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/50 mb-1">Соцсети (по одному URL на строку)</label>
                    <textarea
                      value={jsonLdSchemas.organization?.sameAs?.join('\n') || ''}
                      onChange={(e) => setJsonLdSchemas(prev => ({
                        ...prev,
                        organization: { 
                          ...prev.organization, 
                          sameAs: e.target.value.split('\n').filter((s: string) => s.trim()) 
                        }
                      }))}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none h-20 resize-none font-mono"
                      placeholder="https://instagram.com/...\nhttps://t.me/..."
                    />
                  </div>
                </div>
                
                {/* JSON Preview */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-white/50 flex items-center gap-2">
                      <Eye size={14} /> Предпросмотр JSON-LD
                    </label>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(jsonLdSchemas.organization || {}, null, 2))}
                      className="px-2 py-1 bg-zinc-700 text-white/70 rounded text-xs hover:bg-zinc-600"
                    >
                      Копировать
                    </button>
                  </div>
                  <div className="bg-black p-4 rounded-lg overflow-auto max-h-[500px]">
                    <pre className="text-green-400 text-xs whitespace-pre">
                      {JSON.stringify(jsonLdSchemas.organization || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NewsArticle Schema Editor */}
          {selectedSchemaPage === 'newsArticle' && (
            <div className="bg-zinc-900 p-6 rounded-xl border border-white/5">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                <Newspaper size={20} className="text-blue-500" />
                NewsArticle Schema - Настройки по умолчанию
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 mb-4">
                    <p className="text-blue-400 text-sm font-medium mb-2">ℹ️ Автоматическая генерация</p>
                    <p className="text-white/60 text-xs">
                      NewsArticle schema автоматически генерируется для каждой новости из данных статьи.
                      Здесь вы можете настроить общие параметры издателя.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/50 mb-1">Название издателя</label>
                    <input
                      type="text"
                      value={jsonLdSchemas.newsArticleDefaults?.publisherName || 'Medisson Lounge'}
                      onChange={(e) => setJsonLdSchemas(prev => ({
                        ...prev,
                        newsArticleDefaults: { 
                          ...prev.newsArticleDefaults, 
                          publisherName: e.target.value 
                        }
                      }))}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/50 mb-1">URL сайта издателя</label>
                    <input
                      type="text"
                      value={jsonLdSchemas.newsArticleDefaults?.publisherUrl || 'https://medisson-lounge.ru'}
                      onChange={(e) => setJsonLdSchemas(prev => ({
                        ...prev,
                        newsArticleDefaults: { 
                          ...prev.newsArticleDefaults, 
                          publisherUrl: e.target.value 
                        }
                      }))}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/50 mb-1">URL логотипа издателя</label>
                    <input
                      type="text"
                      value={jsonLdSchemas.newsArticleDefaults?.publisherLogo || 'https://medisson-lounge.ru/assets/logo.svg'}
                      onChange={(e) => setJsonLdSchemas(prev => ({
                        ...prev,
                        newsArticleDefaults: { 
                          ...prev.newsArticleDefaults, 
                          publisherLogo: e.target.value 
                        }
                      }))}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/50 mb-1">Язык контента</label>
                    <select
                      value={jsonLdSchemas.newsArticleDefaults?.inLanguage || 'ru-RU'}
                      onChange={(e) => setJsonLdSchemas(prev => ({
                        ...prev,
                        newsArticleDefaults: { 
                          ...prev.newsArticleDefaults, 
                          inLanguage: e.target.value 
                        }
                      }))}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                    >
                      <option value="ru-RU">Русский (ru-RU)</option>
                      <option value="en-US">English (en-US)</option>
                    </select>
                  </div>
                </div>
                
                {/* Example JSON Preview */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-white/50 flex items-center gap-2">
                      <Eye size={14} /> Пример NewsArticle Schema
                    </label>
                  </div>
                  <div className="bg-black p-4 rounded-lg overflow-auto max-h-[400px]">
                    <pre className="text-green-400 text-xs whitespace-pre">
                      {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'NewsArticle',
                        mainEntityOfPage: {
                          '@type': 'WebPage',
                          '@id': 'https://medisson-lounge.ru/news/example-slug'
                        },
                        headline: 'Заголовок новости из данных статьи',
                        description: 'Описание новости',
                        datePublished: '2025-01-01T12:00:00.000Z',
                        dateModified: '2025-01-01T12:00:00.000Z',
                        author: {
                          '@type': 'Organization',
                          name: jsonLdSchemas.newsArticleDefaults?.publisherName || 'Medisson Lounge',
                          url: jsonLdSchemas.newsArticleDefaults?.publisherUrl || 'https://medisson-lounge.ru'
                        },
                        publisher: {
                          '@type': 'Organization',
                          name: jsonLdSchemas.newsArticleDefaults?.publisherName || 'Medisson Lounge',
                          logo: {
                            '@type': 'ImageObject',
                            url: jsonLdSchemas.newsArticleDefaults?.publisherLogo || 'https://medisson-lounge.ru/assets/logo.svg'
                          }
                        },
                        image: {
                          '@type': 'ImageObject',
                          url: 'URL изображения из статьи'
                        },
                        articleSection: 'Категория статьи',
                        inLanguage: jsonLdSchemas.newsArticleDefaults?.inLanguage || 'ru-RU',
                        articleBody: 'Полный текст статьи...'
                      }, null, 2)}
                    </pre>
                  </div>
                  
                  <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-green-400 text-sm font-medium mb-1">✓ Автоматические поля</p>
                    <ul className="text-white/50 text-xs space-y-1">
                      <li>• <strong>headline</strong> — заголовок статьи (meta_title или title)</li>
                      <li>• <strong>description</strong> — описание статьи</li>
                      <li>• <strong>datePublished</strong> — дата публикации</li>
                      <li>• <strong>image</strong> — изображение статьи</li>
                      <li>• <strong>articleSection</strong> — категория статьи</li>
                      <li>• <strong>articleBody</strong> — полный текст статьи</li>
                    </ul>
                  </div>
                  
                  <div className="mt-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <p className="text-amber-400 text-sm font-medium mb-1">📝 Редактирование отдельных новостей</p>
                    <p className="text-white/50 text-xs">
                      Meta title и meta description для отдельных новостей редактируются во вкладке "Страницы" → "Новости".
                    </p>
                  </div>
                  
                  {/* Article vs NewsArticle toggle */}
                  <div className="mt-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={jsonLdSchemas.newsArticleDefaults?.useArticleSchema || false}
                        onChange={(e) => setJsonLdSchemas(prev => ({
                          ...prev,
                          newsArticleDefaults: { 
                            ...prev.newsArticleDefaults, 
                            useArticleSchema: e.target.checked 
                          }
                        }))}
                        className="w-5 h-5 rounded accent-amber-500"
                      />
                      <div>
                        <span className="text-white text-sm font-medium">Использовать Article вместо NewsArticle</span>
                        <p className="text-white/50 text-xs mt-1">
                          Article — для обычных статей. NewsArticle — для новостных публикаций.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FAQ Schema Editor */}
          {selectedSchemaPage === 'faq' && (
            <div className="bg-zinc-900 p-6 rounded-xl border border-white/5">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                <FileText size={20} className="text-purple-500" />
                FAQ Schema — Часто задаваемые вопросы
              </h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <p className="text-purple-400 text-sm font-medium mb-2">ℹ️ FAQ Schema</p>
                  <p className="text-white/60 text-xs">
                    FAQ-разметка помогает вашему контенту появиться в расширенных результатах Google с вопросами и ответами.
                    Добавьте вопросы для каждой страницы отдельно.
                  </p>
                </div>
                
                {/* Page Selector for FAQ */}
                <div>
                  <label className="block text-sm text-white/50 mb-2">Выберите страницу для FAQ:</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'home', label: 'Главная' },
                      { id: 'loyalty', label: 'Лояльность' },
                      ...locations.map(loc => ({ id: `location_${loc.slug}`, label: loc.name }))
                    ].map(page => (
                      <button
                        key={page.id}
                        onClick={() => {
                          if (!jsonLdSchemas.faq) {
                            setJsonLdSchemas(prev => ({ ...prev, faq: {} }));
                          }
                          if (!jsonLdSchemas.faq?.[page.id]) {
                            setJsonLdSchemas(prev => ({
                              ...prev,
                              faq: { ...prev.faq, [page.id]: [] }
                            }));
                          }
                          setSelectedSchemaPage(`faq_${page.id}`);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm transition ${
                          selectedSchemaPage === `faq_${page.id}`
                            ? 'bg-purple-500 text-white'
                            : 'bg-zinc-800 text-white/70 hover:bg-zinc-700'
                        }`}
                      >
                        {page.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* FAQ Editor for selected page */}
                {selectedSchemaPage.startsWith('faq_') && (() => {
                  const faqPageKey = selectedSchemaPage.replace('faq_', '');
                  const faqItems = jsonLdSchemas.faq?.[faqPageKey] || [];
                  
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-white">
                          FAQ для: {faqPageKey === 'home' ? 'Главная' : 
                                   faqPageKey === 'loyalty' ? 'Лояльность' : 
                                   locations.find(l => `location_${l.slug}` === faqPageKey)?.name || faqPageKey}
                        </h3>
                        <button
                          onClick={() => {
                            setJsonLdSchemas(prev => ({
                              ...prev,
                              faq: {
                                ...prev.faq,
                                [faqPageKey]: [...(prev.faq?.[faqPageKey] || []), { question: '', answer: '' }]
                              }
                            }));
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition"
                        >
                          <Plus size={14} /> Добавить вопрос
                        </button>
                      </div>
                      
                      {faqItems.length === 0 && (
                        <div className="text-center py-8 text-white/40">
                          Нажмите "Добавить вопрос" чтобы создать FAQ для этой страницы
                        </div>
                      )}
                      
                      {faqItems.map((item: any, index: number) => (
                        <div key={index} className="bg-zinc-800 p-4 rounded-lg space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div>
                                <label className="block text-xs text-white/50 mb-1">Вопрос #{index + 1}</label>
                                <input
                                  type="text"
                                  value={item.question || ''}
                                  onChange={(e) => {
                                    const newFaq = [...faqItems];
                                    newFaq[index] = { ...item, question: e.target.value };
                                    setJsonLdSchemas(prev => ({
                                      ...prev,
                                      faq: { ...prev.faq, [faqPageKey]: newFaq }
                                    }));
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-purple-500 outline-none"
                                  placeholder="Например: Как забронировать столик?"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-white/50 mb-1">Ответ</label>
                                <textarea
                                  value={item.answer || ''}
                                  onChange={(e) => {
                                    const newFaq = [...faqItems];
                                    newFaq[index] = { ...item, answer: e.target.value };
                                    setJsonLdSchemas(prev => ({
                                      ...prev,
                                      faq: { ...prev.faq, [faqPageKey]: newFaq }
                                    }));
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-purple-500 outline-none h-20 resize-none"
                                  placeholder="Развёрнутый ответ на вопрос..."
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const newFaq = faqItems.filter((_: any, i: number) => i !== index);
                                setJsonLdSchemas(prev => ({
                                  ...prev,
                                  faq: { ...prev.faq, [faqPageKey]: newFaq }
                                }));
                              }}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* FAQ Preview */}
                      {faqItems.length > 0 && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm text-white/50 flex items-center gap-2">
                              <Eye size={14} /> Предпросмотр FAQ Schema
                            </label>
                            <button
                              onClick={() => copyToClipboard(JSON.stringify({
                                '@context': 'https://schema.org',
                                '@type': 'FAQPage',
                                mainEntity: faqItems.filter((i: any) => i.question && i.answer).map((item: any) => ({
                                  '@type': 'Question',
                                  name: item.question,
                                  acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: item.answer
                                  }
                                }))
                              }, null, 2))}
                              className="px-2 py-1 bg-zinc-700 text-white/70 rounded text-xs hover:bg-zinc-600"
                            >
                              Копировать
                            </button>
                          </div>
                          <div className="bg-black p-4 rounded-lg overflow-auto max-h-[300px]">
                            <pre className="text-green-400 text-xs whitespace-pre">
                              {JSON.stringify({
                                '@context': 'https://schema.org',
                                '@type': 'FAQPage',
                                mainEntity: faqItems.filter((i: any) => i.question && i.answer).map((item: any) => ({
                                  '@type': 'Question',
                                  name: item.question,
                                  acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: item.answer
                                  }
                                }))
                              }, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                {!selectedSchemaPage.startsWith('faq_') && (
                  <div className="text-center py-8 text-white/40">
                    Выберите страницу выше, чтобы добавить FAQ
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Events Schema Editor */}
          {selectedSchemaPage === 'events' && (
            <div className="bg-zinc-900 p-6 rounded-xl border border-white/5">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                <Calendar size={20} className="text-pink-500" />
                Event Schema — События
              </h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-pink-500/10 rounded-lg border border-pink-500/20">
                  <p className="text-pink-400 text-sm font-medium mb-2">ℹ️ О Event Schema</p>
                  <p className="text-white/60 text-xs">
                    Event-разметка помогает вашим мероприятиям появляться в Google с датой, местом и другими деталями.
                    Добавьте события для каждой страницы отдельно.
                  </p>
                </div>
                
                {/* Page Selector for Events */}
                <div>
                  <label className="block text-sm text-white/50 mb-2">Выберите страницу для событий:</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'home', label: 'Главная' },
                      ...locations.map(loc => ({ id: `location_${loc.slug}`, label: loc.name }))
                    ].map(page => (
                      <button
                        key={page.id}
                        onClick={() => {
                          if (!jsonLdSchemas.events) {
                            setJsonLdSchemas(prev => ({ ...prev, events: {} }));
                          }
                          if (!jsonLdSchemas.events?.[page.id]) {
                            setJsonLdSchemas(prev => ({
                              ...prev,
                              events: { ...prev.events, [page.id]: [] }
                            }));
                          }
                          setSelectedSchemaPage(`events_${page.id}`);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm transition ${
                          selectedSchemaPage === `events_${page.id}`
                            ? 'bg-pink-500 text-white'
                            : 'bg-zinc-800 text-white/70 hover:bg-zinc-700'
                        }`}
                      >
                        {page.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Event Editor for selected page */}
                {selectedSchemaPage.startsWith('events_') && (() => {
                  const eventPageKey = selectedSchemaPage.replace('events_', '');
                  const eventItems = jsonLdSchemas.events?.[eventPageKey] || [];
                  
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-white">
                          События для: {eventPageKey === 'home' ? 'Главная' : 
                                       locations.find(l => `location_${l.slug}` === eventPageKey)?.name || eventPageKey}
                        </h3>
                        <button
                          onClick={() => {
                            setJsonLdSchemas(prev => ({
                              ...prev,
                              events: {
                                ...prev.events,
                                [eventPageKey]: [...(prev.events?.[eventPageKey] || []), { 
                                  name: '', 
                                  startDate: new Date().toISOString().split('T')[0] + 'T20:00',
                                  endDate: '',
                                  location: '',
                                  description: '',
                                  performer: '',
                                  organizer: 'Medisson Lounge',
                                  image: '',
                                  url: ''
                                }]
                              }
                            }));
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600 transition"
                        >
                          <Plus size={14} /> Добавить событие
                        </button>
                      </div>
                      
                      {eventItems.length === 0 && (
                        <div className="text-center py-8 text-white/40">
                          Нажмите "Добавить событие" чтобы создать Event для этой страницы
                        </div>
                      )}
                      
                      {eventItems.map((item: any, index: number) => (
                        <div key={index} className="bg-zinc-800 p-4 rounded-lg space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 grid md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-white/50 mb-1">Название события *</label>
                                <input
                                  type="text"
                                  value={item.name || ''}
                                  onChange={(e) => {
                                    const newEvents = [...eventItems];
                                    newEvents[index] = { ...item, name: e.target.value };
                                    setJsonLdSchemas(prev => ({
                                      ...prev,
                                      events: { ...prev.events, [eventPageKey]: newEvents }
                                    }));
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-pink-500 outline-none"
                                  placeholder="Например: Живая музыка с DJ"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-white/50 mb-1">Место проведения</label>
                                <input
                                  type="text"
                                  value={item.location || ''}
                                  onChange={(e) => {
                                    const newEvents = [...eventItems];
                                    newEvents[index] = { ...item, location: e.target.value };
                                    setJsonLdSchemas(prev => ({
                                      ...prev,
                                      events: { ...prev.events, [eventPageKey]: newEvents }
                                    }));
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-pink-500 outline-none"
                                  placeholder="Medisson Lounge Бутово"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-white/50 mb-1">Дата и время начала *</label>
                                <input
                                  type="datetime-local"
                                  value={item.startDate || ''}
                                  onChange={(e) => {
                                    const newEvents = [...eventItems];
                                    newEvents[index] = { ...item, startDate: e.target.value };
                                    setJsonLdSchemas(prev => ({
                                      ...prev,
                                      events: { ...prev.events, [eventPageKey]: newEvents }
                                    }));
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-pink-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-white/50 mb-1">Дата и время окончания</label>
                                <input
                                  type="datetime-local"
                                  value={item.endDate || ''}
                                  onChange={(e) => {
                                    const newEvents = [...eventItems];
                                    newEvents[index] = { ...item, endDate: e.target.value };
                                    setJsonLdSchemas(prev => ({
                                      ...prev,
                                      events: { ...prev.events, [eventPageKey]: newEvents }
                                    }));
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-pink-500 outline-none"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs text-white/50 mb-1">Описание</label>
                                <textarea
                                  value={item.description || ''}
                                  onChange={(e) => {
                                    const newEvents = [...eventItems];
                                    newEvents[index] = { ...item, description: e.target.value };
                                    setJsonLdSchemas(prev => ({
                                      ...prev,
                                      events: { ...prev.events, [eventPageKey]: newEvents }
                                    }));
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-pink-500 outline-none h-16 resize-none"
                                  placeholder="Описание мероприятия..."
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-white/50 mb-1">Исполнитель / Артист</label>
                                <input
                                  type="text"
                                  value={item.performer || ''}
                                  onChange={(e) => {
                                    const newEvents = [...eventItems];
                                    newEvents[index] = { ...item, performer: e.target.value };
                                    setJsonLdSchemas(prev => ({
                                      ...prev,
                                      events: { ...prev.events, [eventPageKey]: newEvents }
                                    }));
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-pink-500 outline-none"
                                  placeholder="DJ Name"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-white/50 mb-1">Организатор</label>
                                <input
                                  type="text"
                                  value={item.organizer || ''}
                                  onChange={(e) => {
                                    const newEvents = [...eventItems];
                                    newEvents[index] = { ...item, organizer: e.target.value };
                                    setJsonLdSchemas(prev => ({
                                      ...prev,
                                      events: { ...prev.events, [eventPageKey]: newEvents }
                                    }));
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-pink-500 outline-none"
                                  placeholder="Medisson Lounge"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-white/50 mb-1">URL изображения</label>
                                <input
                                  type="text"
                                  value={item.image || ''}
                                  onChange={(e) => {
                                    const newEvents = [...eventItems];
                                    newEvents[index] = { ...item, image: e.target.value };
                                    setJsonLdSchemas(prev => ({
                                      ...prev,
                                      events: { ...prev.events, [eventPageKey]: newEvents }
                                    }));
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-pink-500 outline-none"
                                  placeholder="https://..."
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-white/50 mb-1">URL страницы события</label>
                                <input
                                  type="text"
                                  value={item.url || ''}
                                  onChange={(e) => {
                                    const newEvents = [...eventItems];
                                    newEvents[index] = { ...item, url: e.target.value };
                                    setJsonLdSchemas(prev => ({
                                      ...prev,
                                      events: { ...prev.events, [eventPageKey]: newEvents }
                                    }));
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-pink-500 outline-none"
                                  placeholder="https://medisson-lounge.ru/news/..."
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const newEvents = eventItems.filter((_: any, i: number) => i !== index);
                                setJsonLdSchemas(prev => ({
                                  ...prev,
                                  events: { ...prev.events, [eventPageKey]: newEvents }
                                }));
                              }}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Event Preview */}
                      {eventItems.length > 0 && eventItems.some((i: any) => i.name && i.startDate) && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm text-white/50 flex items-center gap-2">
                              <Eye size={14} /> Предпросмотр Event Schema
                            </label>
                            <button
                              onClick={() => copyToClipboard(JSON.stringify(eventItems.filter((i: any) => i.name && i.startDate).map((event: any) => ({
                                '@context': 'https://schema.org',
                                '@type': 'Event',
                                name: event.name,
                                startDate: event.startDate,
                                endDate: event.endDate || undefined,
                                description: event.description || undefined,
                                location: event.location ? { '@type': 'Place', name: event.location } : undefined,
                                performer: event.performer ? { '@type': 'PerformingGroup', name: event.performer } : undefined,
                                organizer: event.organizer ? { '@type': 'Organization', name: event.organizer } : undefined,
                                image: event.image || undefined,
                                url: event.url || undefined,
                                eventStatus: 'https://schema.org/EventScheduled',
                                eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode'
                              })), null, 2))}
                              className="px-2 py-1 bg-zinc-700 text-white/70 rounded text-xs hover:bg-zinc-600"
                            >
                              Копировать
                            </button>
                          </div>
                          <div className="bg-black p-4 rounded-lg overflow-auto max-h-[300px]">
                            <pre className="text-green-400 text-xs whitespace-pre">
                              {JSON.stringify(eventItems.filter((i: any) => i.name && i.startDate).map((event: any) => ({
                                '@context': 'https://schema.org',
                                '@type': 'Event',
                                name: event.name,
                                startDate: event.startDate,
                                endDate: event.endDate || undefined,
                                description: event.description || undefined,
                                location: event.location ? { '@type': 'Place', name: event.location } : undefined,
                                performer: event.performer ? { '@type': 'PerformingGroup', name: event.performer } : undefined,
                                organizer: event.organizer ? { '@type': 'Organization', name: event.organizer } : undefined,
                                image: event.image || undefined,
                                url: event.url || undefined,
                                eventStatus: 'https://schema.org/EventScheduled',
                                eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode'
                              })), null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                {!selectedSchemaPage.startsWith('events_') && (
                  <div className="text-center py-8 text-white/40">
                    Выберите страницу выше, чтобы добавить события
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reviews Schema Editor */}
          {selectedSchemaPage === 'reviews' && (
            <div className="bg-zinc-900 p-6 rounded-xl border border-white/5">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                <Star size={20} className="text-yellow-500" />
                Review Schema — Отзывы
              </h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <p className="text-yellow-400 text-sm font-medium mb-2">ℹ️ О Review Schema</p>
                  <p className="text-white/60 text-xs">
                    Review-разметка помогает отображать рейтинги и отзывы в результатах Google.
                    Добавьте отзывы для локаций чтобы улучшить видимость в поиске.
                  </p>
                </div>
                
                {/* Page Selector for Reviews */}
                <div>
                  <label className="block text-sm text-white/50 mb-2">Выберите локацию для отзывов:</label>
                  <div className="flex flex-wrap gap-2">
                    {locations.map(loc => (
                      <button
                        key={loc.slug}
                        onClick={() => {
                          const pageId = `location_${loc.slug}`;
                          if (!jsonLdSchemas.reviews) {
                            setJsonLdSchemas(prev => ({ ...prev, reviews: {} }));
                          }
                          if (!jsonLdSchemas.reviews?.[pageId]) {
                            setJsonLdSchemas(prev => ({
                              ...prev,
                              reviews: { ...prev.reviews, [pageId]: [] }
                            }));
                          }
                          setSelectedSchemaPage(`reviews_${pageId}`);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm transition ${
                          selectedSchemaPage === `reviews_location_${loc.slug}`
                            ? 'bg-yellow-500 text-black'
                            : 'bg-zinc-800 text-white/70 hover:bg-zinc-700'
                        }`}
                      >
                        {loc.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Review Editor for selected location */}
                {selectedSchemaPage.startsWith('reviews_') && (() => {
                  const reviewPageKey = selectedSchemaPage.replace('reviews_', '');
                  const reviewItems = jsonLdSchemas.reviews?.[reviewPageKey] || [];
                  const locationName = locations.find(l => `location_${l.slug}` === reviewPageKey)?.name || '';
                  
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-white">
                          Отзывы для: {locationName}
                        </h3>
                        <button
                          onClick={() => {
                            setJsonLdSchemas(prev => ({
                              ...prev,
                              reviews: {
                                ...prev.reviews,
                                [reviewPageKey]: [...(prev.reviews?.[reviewPageKey] || []), { 
                                  author: '', 
                                  reviewBody: '',
                                  ratingValue: 5,
                                  datePublished: new Date().toISOString().split('T')[0],
                                  itemReviewed: {
                                    name: locationName,
                                    type: 'Restaurant'
                                  }
                                }]
                              }
                            }));
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500 text-black rounded-lg text-sm hover:bg-yellow-600 transition"
                        >
                          <Plus size={14} /> Добавить отзыв
                        </button>
                      </div>
                      
                      {/* Aggregate Rating Settings */}
                      <div className="bg-zinc-800 p-4 rounded-lg">
                        <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                          <Star size={16} className="text-yellow-500" /> Средний рейтинг (AggregateRating)
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-white/50 mb-1">Средняя оценка (1-5)</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              value={jsonLdSchemas.aggregateRatings?.[reviewPageKey]?.ratingValue || ''}
                              onChange={(e) => {
                                setJsonLdSchemas(prev => ({
                                  ...prev,
                                  aggregateRatings: {
                                    ...prev.aggregateRatings,
                                    [reviewPageKey]: {
                                      ...prev.aggregateRatings?.[reviewPageKey],
                                      ratingValue: parseFloat(e.target.value) || 0
                                    }
                                  }
                                }));
                              }}
                              className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-yellow-500 outline-none"
                              placeholder="4.8"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/50 mb-1">Количество отзывов</label>
                            <input
                              type="number"
                              min="0"
                              value={jsonLdSchemas.aggregateRatings?.[reviewPageKey]?.reviewCount || ''}
                              onChange={(e) => {
                                setJsonLdSchemas(prev => ({
                                  ...prev,
                                  aggregateRatings: {
                                    ...prev.aggregateRatings,
                                    [reviewPageKey]: {
                                      ...prev.aggregateRatings?.[reviewPageKey],
                                      reviewCount: parseInt(e.target.value) || 0
                                    }
                                  }
                                }));
                              }}
                              className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-yellow-500 outline-none"
                              placeholder="150"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {reviewItems.length === 0 && (
                        <div className="text-center py-8 text-white/40">
                          Нажмите "Добавить отзыв" чтобы создать Review для этой локации
                        </div>
                      )}
                      
                      {reviewItems.map((item: any, index: number) => (
                        <div key={index} className="bg-zinc-800 p-4 rounded-lg space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 grid md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-white/50 mb-1 flex items-center gap-1">
                                  <User size={12} /> Автор *
                                </label>
                                <input
                                  type="text"
                                  value={item.author || ''}
                                  onChange={(e) => {
                                    const newReviews = [...reviewItems];
                                    newReviews[index] = { ...item, author: e.target.value };
                                    setJsonLdSchemas(prev => ({
                                      ...prev,
                                      reviews: { ...prev.reviews, [reviewPageKey]: newReviews }
                                    }));
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-yellow-500 outline-none"
                                  placeholder="Иван Иванов"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-white/50 mb-1 flex items-center gap-1">
                                  <Star size={12} /> Оценка (1-5) *
                                </label>
                                <select
                                  value={item.ratingValue || 5}
                                  onChange={(e) => {
                                    const newReviews = [...reviewItems];
                                    newReviews[index] = { ...item, ratingValue: parseInt(e.target.value) };
                                    setJsonLdSchemas(prev => ({
                                      ...prev,
                                      reviews: { ...prev.reviews, [reviewPageKey]: newReviews }
                                    }));
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-yellow-500 outline-none"
                                >
                                  <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                                  <option value={4}>⭐⭐⭐⭐ (4)</option>
                                  <option value={3}>⭐⭐⭐ (3)</option>
                                  <option value={2}>⭐⭐ (2)</option>
                                  <option value={1}>⭐ (1)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-white/50 mb-1">Дата публикации</label>
                                <input
                                  type="date"
                                  value={item.datePublished || ''}
                                  onChange={(e) => {
                                    const newReviews = [...reviewItems];
                                    newReviews[index] = { ...item, datePublished: e.target.value };
                                    setJsonLdSchemas(prev => ({
                                      ...prev,
                                      reviews: { ...prev.reviews, [reviewPageKey]: newReviews }
                                    }));
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-yellow-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-white/50 mb-1">Тип объекта</label>
                                <select
                                  value={item.itemReviewed?.type || 'Restaurant'}
                                  onChange={(e) => {
                                    const newReviews = [...reviewItems];
                                    newReviews[index] = { 
                                      ...item, 
                                      itemReviewed: { 
                                        ...item.itemReviewed, 
                                        type: e.target.value 
                                      } 
                                    };
                                    setJsonLdSchemas(prev => ({
                                      ...prev,
                                      reviews: { ...prev.reviews, [reviewPageKey]: newReviews }
                                    }));
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-yellow-500 outline-none"
                                >
                                  <option value="Restaurant">Restaurant</option>
                                  <option value="BarOrPub">BarOrPub</option>
                                  <option value="NightClub">NightClub</option>
                                  <option value="LocalBusiness">LocalBusiness</option>
                                </select>
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs text-white/50 mb-1">Текст отзыва *</label>
                                <textarea
                                  value={item.reviewBody || ''}
                                  onChange={(e) => {
                                    const newReviews = [...reviewItems];
                                    newReviews[index] = { ...item, reviewBody: e.target.value };
                                    setJsonLdSchemas(prev => ({
                                      ...prev,
                                      reviews: { ...prev.reviews, [reviewPageKey]: newReviews }
                                    }));
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-yellow-500 outline-none h-20 resize-none"
                                  placeholder="Отличное место! Прекрасная атмосфера и вкусная кухня..."
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const newReviews = reviewItems.filter((_: any, i: number) => i !== index);
                                setJsonLdSchemas(prev => ({
                                  ...prev,
                                  reviews: { ...prev.reviews, [reviewPageKey]: newReviews }
                                }));
                              }}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Review Preview */}
                      {(reviewItems.length > 0 || jsonLdSchemas.aggregateRatings?.[reviewPageKey]?.ratingValue) && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm text-white/50 flex items-center gap-2">
                              <Eye size={14} /> Предпросмотр Review Schema
                            </label>
                          </div>
                          <div className="bg-black p-4 rounded-lg overflow-auto max-h-[300px]">
                            <pre className="text-green-400 text-xs whitespace-pre">
                              {JSON.stringify({
                                reviews: reviewItems.filter((i: any) => i.author && i.reviewBody).map((review: any) => ({
                                  '@context': 'https://schema.org',
                                  '@type': 'Review',
                                  author: { '@type': 'Person', name: review.author },
                                  reviewBody: review.reviewBody,
                                  reviewRating: {
                                    '@type': 'Rating',
                                    ratingValue: review.ratingValue,
                                    bestRating: 5,
                                    worstRating: 1
                                  },
                                  datePublished: review.datePublished || undefined,
                                  itemReviewed: review.itemReviewed ? {
                                    '@type': review.itemReviewed.type || 'LocalBusiness',
                                    name: review.itemReviewed.name || locationName
                                  } : undefined
                                })),
                                aggregateRating: jsonLdSchemas.aggregateRatings?.[reviewPageKey] ? {
                                  '@context': 'https://schema.org',
                                  '@type': 'LocalBusiness',
                                  name: locationName,
                                  aggregateRating: {
                                    '@type': 'AggregateRating',
                                    ratingValue: jsonLdSchemas.aggregateRatings[reviewPageKey].ratingValue,
                                    reviewCount: jsonLdSchemas.aggregateRatings[reviewPageKey].reviewCount,
                                    bestRating: 5,
                                    worstRating: 1
                                  }
                                } : undefined
                              }, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                {!selectedSchemaPage.startsWith('reviews_') && (
                  <div className="text-center py-8 text-white/40">
                    Выберите локацию выше, чтобы добавить отзывы
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Breadcrumbs Schema Editor */}
          {selectedSchemaPage === 'breadcrumbs' && (
            <div className="bg-zinc-900 p-6 rounded-xl border border-white/5">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                <ChevronDown size={20} className="text-orange-500" />
                BreadcrumbList Schema — Хлебные крошки
              </h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <p className="text-orange-400 text-sm font-medium mb-2">ℹ️ О BreadcrumbList</p>
                  <p className="text-white/60 text-xs">
                    BreadcrumbList помогает Google понять структуру вашего сайта и показать путь к странице прямо в результатах поиска.
                    Вы можете настроить названия элементов для каждой страницы.
                  </p>
                </div>
                
                {/* Global Breadcrumb Settings */}
                <div className="space-y-4">
                  <h3 className="font-medium text-white flex items-center gap-2">
                    <Globe size={16} className="text-amber-500" />
                    Глобальные настройки
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/50 mb-1">Название главной страницы</label>
                      <input
                        type="text"
                        value={jsonLdSchemas.breadcrumbs?.homeName || 'Главная'}
                        onChange={(e) => setJsonLdSchemas(prev => ({
                          ...prev,
                          breadcrumbs: { ...prev.breadcrumbs, homeName: e.target.value }
                        }))}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                        placeholder="Главная"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/50 mb-1">URL сайта</label>
                      <input
                        type="text"
                        value={jsonLdSchemas.breadcrumbs?.siteUrl || 'https://medisson-lounge.ru'}
                        onChange={(e) => setJsonLdSchemas(prev => ({
                          ...prev,
                          breadcrumbs: { ...prev.breadcrumbs, siteUrl: e.target.value }
                        }))}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                        placeholder="https://medisson-lounge.ru"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Page-specific Breadcrumb Names */}
                <div className="space-y-4">
                  <h3 className="font-medium text-white flex items-center gap-2">
                    <FileText size={16} className="text-blue-500" />
                    Названия страниц в хлебных крошках
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/50 mb-1">Страница новостей</label>
                      <input
                        type="text"
                        value={jsonLdSchemas.breadcrumbs?.newsName || 'Новости'}
                        onChange={(e) => setJsonLdSchemas(prev => ({
                          ...prev,
                          breadcrumbs: { ...prev.breadcrumbs, newsName: e.target.value }
                        }))}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                        placeholder="Новости"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/50 mb-1">Программа лояльности</label>
                      <input
                        type="text"
                        value={jsonLdSchemas.breadcrumbs?.loyaltyName || 'Программа лояльности'}
                        onChange={(e) => setJsonLdSchemas(prev => ({
                          ...prev,
                          breadcrumbs: { ...prev.breadcrumbs, loyaltyName: e.target.value }
                        }))}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                        placeholder="Программа лояльности"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/50 mb-1">Политика конфиденциальности</label>
                      <input
                        type="text"
                        value={jsonLdSchemas.breadcrumbs?.privacyName || 'Политика конфиденциальности'}
                        onChange={(e) => setJsonLdSchemas(prev => ({
                          ...prev,
                          breadcrumbs: { ...prev.breadcrumbs, privacyName: e.target.value }
                        }))}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                        placeholder="Политика конфиденциальности"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/50 mb-1">Раздел локаций</label>
                      <input
                        type="text"
                        value={jsonLdSchemas.breadcrumbs?.locationsName || 'Локации'}
                        onChange={(e) => setJsonLdSchemas(prev => ({
                          ...prev,
                          breadcrumbs: { ...prev.breadcrumbs, locationsName: e.target.value }
                        }))}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                        placeholder="Локации"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Location-specific names */}
                {locations.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-white flex items-center gap-2">
                      <MapPin size={16} className="text-green-500" />
                      Названия локаций
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {locations.map(loc => (
                        <div key={loc.slug}>
                          <label className="block text-sm text-white/50 mb-1">{loc.name}</label>
                          <input
                            type="text"
                            value={jsonLdSchemas.breadcrumbs?.locations?.[loc.slug] || loc.name}
                            onChange={(e) => setJsonLdSchemas(prev => ({
                              ...prev,
                              breadcrumbs: { 
                                ...prev.breadcrumbs, 
                                locations: { 
                                  ...prev.breadcrumbs?.locations, 
                                  [loc.slug]: e.target.value 
                                }
                              }
                            }))}
                            className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                            placeholder={loc.name}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Preview */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-white/50 flex items-center gap-2">
                      <Eye size={14} /> Пример BreadcrumbList Schema
                    </label>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                          {
                            '@type': 'ListItem',
                            position: 1,
                            name: jsonLdSchemas.breadcrumbs?.homeName || 'Главная',
                            item: jsonLdSchemas.breadcrumbs?.siteUrl || 'https://medisson-lounge.ru'
                          },
                          {
                            '@type': 'ListItem',
                            position: 2,
                            name: jsonLdSchemas.breadcrumbs?.newsName || 'Новости',
                            item: `${jsonLdSchemas.breadcrumbs?.siteUrl || 'https://medisson-lounge.ru'}/news`
                          },
                          {
                            '@type': 'ListItem',
                            position: 3,
                            name: 'Заголовок статьи',
                            item: `${jsonLdSchemas.breadcrumbs?.siteUrl || 'https://medisson-lounge.ru'}/news/example-slug`
                          }
                        ]
                      }, null, 2))}
                      className="px-2 py-1 bg-zinc-700 text-white/70 rounded text-xs hover:bg-zinc-600"
                    >
                      Копировать
                    </button>
                  </div>
                  <div className="bg-black p-4 rounded-lg overflow-auto max-h-[300px]">
                    <pre className="text-green-400 text-xs whitespace-pre">
                      {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                          {
                            '@type': 'ListItem',
                            position: 1,
                            name: jsonLdSchemas.breadcrumbs?.homeName || 'Главная',
                            item: jsonLdSchemas.breadcrumbs?.siteUrl || 'https://medisson-lounge.ru'
                          },
                          {
                            '@type': 'ListItem',
                            position: 2,
                            name: jsonLdSchemas.breadcrumbs?.newsName || 'Новости',
                            item: `${jsonLdSchemas.breadcrumbs?.siteUrl || 'https://medisson-lounge.ru'}/news`
                          },
                          {
                            '@type': 'ListItem',
                            position: 3,
                            name: 'Заголовок статьи',
                            item: `${jsonLdSchemas.breadcrumbs?.siteUrl || 'https://medisson-lounge.ru'}/news/example-slug`
                          }
                        ]
                      }, null, 2)}
                    </pre>
                  </div>
                </div>
                
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-green-400 text-sm font-medium mb-1">✓ Автоматическая генерация</p>
                  <p className="text-white/50 text-xs">
                    BreadcrumbList автоматически генерируется для каждой страницы на основе этих настроек.
                    Для страниц новостей и локаций добавляются соответствующие промежуточные элементы.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Location Schema Editor */}
          {selectedSchemaPage.startsWith('location_') && (() => {
            const locationSlug = selectedSchemaPage.replace('location_', '');
            const location = locations.find(l => l.slug === locationSlug);
            if (!location) return null;
            
            const schemaKey = selectedSchemaPage;
            const currentSchema = jsonLdSchemas[schemaKey] || {
              '@context': 'https://schema.org',
              '@type': 'Restaurant',
              name: location.name,
              description: location.description || '',
              address: location.address || '',
              telephone: location.phone || '',
              openingHours: 'Mo-Su 12:00-06:00',
              priceRange: '₽₽₽',
              servesCuisine: 'Европейская, Авторская',
              acceptsReservations: true
            };
            
            return (
              <div className="bg-zinc-900 p-6 rounded-xl border border-white/5">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                  <MapPin size={20} className="text-green-500" />
                  LocalBusiness Schema: {location.name}
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/50 mb-1">Тип заведения</label>
                      <select
                        value={currentSchema['@type'] || 'Restaurant'}
                        onChange={(e) => setJsonLdSchemas(prev => ({
                          ...prev,
                          [schemaKey]: { ...currentSchema, '@type': e.target.value }
                        }))}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                      >
                        <option value="Restaurant">Restaurant</option>
                        <option value="BarOrPub">BarOrPub</option>
                        <option value="NightClub">NightClub</option>
                        <option value="CafeOrCoffeeShop">CafeOrCoffeeShop</option>
                        <option value="LocalBusiness">LocalBusiness</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-white/50 mb-1">Название</label>
                      <input
                        type="text"
                        value={currentSchema.name || ''}
                        onChange={(e) => setJsonLdSchemas(prev => ({
                          ...prev,
                          [schemaKey]: { ...currentSchema, name: e.target.value }
                        }))}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-white/50 mb-1">Описание</label>
                      <textarea
                        value={currentSchema.description || ''}
                        onChange={(e) => setJsonLdSchemas(prev => ({
                          ...prev,
                          [schemaKey]: { ...currentSchema, description: e.target.value }
                        }))}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none h-20 resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-white/50 mb-1 flex items-center gap-2">
                        <MapPinned size={14} /> Адрес
                      </label>
                      <input
                        type="text"
                        value={currentSchema.address || ''}
                        onChange={(e) => setJsonLdSchemas(prev => ({
                          ...prev,
                          [schemaKey]: { ...currentSchema, address: e.target.value }
                        }))}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-white/50 mb-1 flex items-center gap-2">
                        <Phone size={14} /> Телефон
                      </label>
                      <input
                        type="text"
                        value={currentSchema.telephone || ''}
                        onChange={(e) => setJsonLdSchemas(prev => ({
                          ...prev,
                          [schemaKey]: { ...currentSchema, telephone: e.target.value }
                        }))}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-white/50 mb-1 flex items-center gap-2">
                        <Clock size={14} /> Часы работы
                      </label>
                      <input
                        type="text"
                        value={currentSchema.openingHours || ''}
                        onChange={(e) => setJsonLdSchemas(prev => ({
                          ...prev,
                          [schemaKey]: { ...currentSchema, openingHours: e.target.value }
                        }))}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                        placeholder="Mo-Su 12:00-06:00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-white/50 mb-1 flex items-center gap-2">
                        <DollarSign size={14} /> Ценовой диапазон
                      </label>
                      <select
                        value={currentSchema.priceRange || '₽₽₽'}
                        onChange={(e) => setJsonLdSchemas(prev => ({
                          ...prev,
                          [schemaKey]: { ...currentSchema, priceRange: e.target.value }
                        }))}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                      >
                        <option value="₽">₽ (бюджетный)</option>
                        <option value="₽₽">₽₽ (средний)</option>
                        <option value="₽₽₽">₽₽₽ (выше среднего)</option>
                        <option value="₽₽₽₽">₽₽₽₽ (премиум)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-white/50 mb-1">Кухня</label>
                      <input
                        type="text"
                        value={currentSchema.servesCuisine || ''}
                        onChange={(e) => setJsonLdSchemas(prev => ({
                          ...prev,
                          [schemaKey]: { ...currentSchema, servesCuisine: e.target.value }
                        }))}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                        placeholder="Европейская, Авторская"
                      />
                    </div>
                    
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={currentSchema.acceptsReservations !== false}
                        onChange={(e) => setJsonLdSchemas(prev => ({
                          ...prev,
                          [schemaKey]: { ...currentSchema, acceptsReservations: e.target.checked }
                        }))}
                        className="w-5 h-5 rounded"
                      />
                      <span>Принимает бронирования</span>
                    </label>
                  </div>
                  
                  {/* JSON Preview */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-white/50 flex items-center gap-2">
                        <Eye size={14} /> Предпросмотр JSON-LD
                      </label>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify({
                          '@context': 'https://schema.org',
                          ...currentSchema
                        }, null, 2))}
                        className="px-2 py-1 bg-zinc-700 text-white/70 rounded text-xs hover:bg-zinc-600"
                      >
                        Копировать
                      </button>
                    </div>
                    <div className="bg-black p-4 rounded-lg overflow-auto max-h-[500px]">
                      <pre className="text-green-400 text-xs whitespace-pre">
                        {JSON.stringify({
                          '@context': 'https://schema.org',
                          ...currentSchema
                        }, null, 2)}
                      </pre>
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-blue-400 text-sm font-medium mb-1">💡 Подсказка</p>
                      <p className="text-white/50 text-xs">
                        Эта схема будет автоматически добавлена на страницу локации.
                        Google использует эти данные для rich snippets в поиске.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          
          {/* Info Block */}
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 p-4 rounded-xl border border-green-500/20">
            <h3 className="font-medium text-white mb-2">Что такое JSON-LD Schema?</h3>
            <p className="text-white/60 text-sm">
              Структурированные данные помогают поисковым системам лучше понимать ваш сайт.
              Это даёт расширенные результаты в Google: звёзды рейтинга, часы работы, адрес и др.
            </p>
            <a 
              href="https://search.google.com/test/rich-results" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-2 text-amber-400 text-sm hover:underline"
            >
              Проверить в Google Rich Results Test →
            </a>
          </div>
        </div>
      )}

      {/* Sitemap Tab */}
      {activeTab === 'sitemap' && (
        <div className="bg-zinc-900 p-6 rounded-xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <RefreshCw size={20} className="text-green-500" />
              Автоматический Sitemap.xml
            </h2>
            <button
              onClick={() => copyToClipboard(generateSitemap())}
              className="px-3 py-1 bg-amber-500 text-black rounded text-sm font-medium"
            >
              Копировать
            </button>
          </div>
          
          <div className="bg-black p-4 rounded-lg overflow-auto max-h-96">
            <pre className="text-green-400 text-xs whitespace-pre">{generateSitemap()}</pre>
          </div>
          
          <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-blue-400 text-sm">
              <strong>Всего URL:</strong> {staticPages.length + locations.length + news.length} страниц
            </p>
            <p className="text-white/50 text-xs mt-1">
              Sitemap автоматически включает все страницы, локации и новости
            </p>
          </div>
        </div>
      )}

      {/* Tracking Tab */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          {/* Yandex Metrika */}
          <div className="bg-zinc-900 p-6 rounded-xl border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Activity className="text-red-500" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Яндекс.Метрика</h2>
                <p className="text-sm text-white/50">Вставьте код счётчика из Яндекс.Метрики</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm text-white/70">Код счётчика (весь script-тег)</label>
              <textarea
                value={trackingConfig.yandexMetrika}
                onChange={(e) => setTrackingConfig(prev => ({ ...prev, yandexMetrika: e.target.value }))}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white h-40 resize-none font-mono text-sm"
                placeholder={`<!-- Yandex.Metrika counter -->\n<script type="text/javascript">\n   (function(m,e,t,r,i,k,a){...})(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");\n   ym(XXXXXXXX, "init", {...});\n</script>\n<noscript>...</noscript>\n<!-- /Yandex.Metrika counter -->`}
              />
              <p className="text-xs text-white/40">Скопируйте полный код счётчика из настроек Яндекс.Метрики и вставьте сюда</p>
            </div>
          </div>

          {/* Google Search Console */}
          <div className="bg-zinc-900 p-6 rounded-xl border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Search className="text-blue-500" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Google Search Console</h2>
                <p className="text-sm text-white/50">Мета-тег для подтверждения владения сайтом</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm text-white/70">Мета-тег верификации</label>
              <textarea
                value={trackingConfig.googleSearchConsole}
                onChange={(e) => setTrackingConfig(prev => ({ ...prev, googleSearchConsole: e.target.value }))}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white h-20 resize-none font-mono text-sm"
                placeholder='<meta name="google-site-verification" content="ваш-код-верификации" />'
              />
              <p className="text-xs text-white/40">Скопируйте мета-тег из Google Search Console → Настройки → Подтверждение права собственности</p>
            </div>
          </div>

          {/* Google Analytics */}
          <div className="bg-zinc-900 p-6 rounded-xl border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <BarChart3 className="text-orange-500" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Google Analytics (GA4)</h2>
                <p className="text-sm text-white/50">Код отслеживания Google Analytics</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm text-white/70">Google tag (gtag.js)</label>
              <textarea
                value={trackingConfig.googleAnalytics}
                onChange={(e) => setTrackingConfig(prev => ({ ...prev, googleAnalytics: e.target.value }))}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white h-40 resize-none font-mono text-sm"
                placeholder={`<!-- Google tag (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', 'G-XXXXXXXX');\n</script>`}
              />
              <p className="text-xs text-white/40">Скопируйте код из Google Analytics → Администратор → Потоки данных → Инструкция по добавлению тега</p>
            </div>
          </div>

          {/* Custom Scripts */}
          <div className="bg-zinc-900 p-6 rounded-xl border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Code className="text-purple-500" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Дополнительные скрипты</h2>
                <p className="text-sm text-white/50">Другие теги и скрипты для &lt;head&gt;</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm text-white/70">Произвольный HTML/скрипты</label>
              <textarea
                value={trackingConfig.customHeadScripts}
                onChange={(e) => setTrackingConfig(prev => ({ ...prev, customHeadScripts: e.target.value }))}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white h-32 resize-none font-mono text-sm"
                placeholder={`<!-- Пример: Facebook Pixel, VK Pixel, и т.д. -->\n<script>...</script>`}
              />
              <p className="text-xs text-white/40">Любые дополнительные мета-теги, скрипты или стили для добавления в &lt;head&gt;</p>
            </div>
          </div>

          {/* Status Preview */}
          <div className="bg-zinc-900 p-6 rounded-xl border border-white/5">
            <h2 className="text-lg font-bold mb-4">Статус интеграций</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border ${trackingConfig.yandexMetrika ? 'bg-green-500/10 border-green-500/30' : 'bg-zinc-800 border-white/5'}`}>
                <div className="flex items-center gap-2">
                  <Activity size={16} className={trackingConfig.yandexMetrika ? 'text-green-500' : 'text-white/30'} />
                  <span className="font-medium">Яндекс.Метрика</span>
                </div>
                <p className={`text-sm mt-1 ${trackingConfig.yandexMetrika ? 'text-green-400' : 'text-white/40'}`}>
                  {trackingConfig.yandexMetrika ? '✓ Настроена' : 'Не настроена'}
                </p>
              </div>
              
              <div className={`p-4 rounded-lg border ${trackingConfig.googleSearchConsole ? 'bg-green-500/10 border-green-500/30' : 'bg-zinc-800 border-white/5'}`}>
                <div className="flex items-center gap-2">
                  <Search size={16} className={trackingConfig.googleSearchConsole ? 'text-green-500' : 'text-white/30'} />
                  <span className="font-medium">Google Search Console</span>
                </div>
                <p className={`text-sm mt-1 ${trackingConfig.googleSearchConsole ? 'text-green-400' : 'text-white/40'}`}>
                  {trackingConfig.googleSearchConsole ? '✓ Верификация добавлена' : 'Не настроена'}
                </p>
              </div>
              
              <div className={`p-4 rounded-lg border ${trackingConfig.googleAnalytics ? 'bg-green-500/10 border-green-500/30' : 'bg-zinc-800 border-white/5'}`}>
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className={trackingConfig.googleAnalytics ? 'text-green-500' : 'text-white/30'} />
                  <span className="font-medium">Google Analytics</span>
                </div>
                <p className={`text-sm mt-1 ${trackingConfig.googleAnalytics ? 'text-green-400' : 'text-white/40'}`}>
                  {trackingConfig.googleAnalytics ? '✓ Настроена' : 'Не настроена'}
                </p>
              </div>
              
              <div className={`p-4 rounded-lg border ${trackingConfig.customHeadScripts ? 'bg-green-500/10 border-green-500/30' : 'bg-zinc-800 border-white/5'}`}>
                <div className="flex items-center gap-2">
                  <Code size={16} className={trackingConfig.customHeadScripts ? 'text-green-500' : 'text-white/30'} />
                  <span className="font-medium">Дополнительные скрипты</span>
                </div>
                <p className={`text-sm mt-1 ${trackingConfig.customHeadScripts ? 'text-green-400' : 'text-white/40'}`}>
                  {trackingConfig.customHeadScripts ? '✓ Добавлены' : 'Не добавлены'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Robots.txt Tab */}
      {activeTab === 'robots' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 p-6 rounded-xl border border-white/5">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Settings size={20} className="text-purple-500" />
              Настройки Robots.txt
            </h2>

            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={robotsConfig.allowAll}
                  onChange={(e) => setRobotsConfig(prev => ({ ...prev, allowAll: e.target.checked }))}
                  className="w-5 h-5 rounded"
                />
                <span>Разрешить индексацию всего сайта</span>
              </label>

              <div>
                <label className="block text-sm text-white/50 mb-2">Crawl Delay (секунды)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={robotsConfig.crawlDelay}
                  onChange={(e) => setRobotsConfig(prev => ({ ...prev, crawlDelay: Number(e.target.value) }))}
                  className="w-24 bg-black border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-white/50 mb-2">Запретить индексацию (по одному пути на строку)</label>
                <textarea
                  value={robotsConfig.disallowPaths.join('\n')}
                  onChange={(e) => setRobotsConfig(prev => ({ 
                    ...prev, 
                    disallowPaths: e.target.value.split('\n').filter(p => p.trim()) 
                  }))}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white h-24 resize-none font-mono text-sm"
                  placeholder="/admin&#10;/api"
                />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Предпросмотр Robots.txt</h2>
              <button
                onClick={() => copyToClipboard(generateRobotsTxt())}
                className="px-3 py-1 bg-amber-500 text-black rounded text-sm font-medium"
              >
                Копировать
              </button>
            </div>
            
            <div className="bg-black p-4 rounded-lg overflow-auto max-h-80">
              <pre className="text-purple-400 text-xs whitespace-pre">{generateRobotsTxt()}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
