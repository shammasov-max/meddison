import React, { useState, useEffect, useCallback } from 'react';
import { dataService } from '../../services/dataService';
import { GlowButton } from '../../components/ui/GlowButton';
import { Save, ChevronDown, ChevronUp, Plus, Trash2, Upload, ImageIcon } from 'lucide-react';
import { useEnterSave } from '../../hooks/useEnterSave';
import { usePasteAutoSave } from '../../hooks/usePasteAutoSave';
import type { SiteContent } from '../../types';

type TabType = 'hero' | 'about' | 'advantages' | 'atmosphere' | 'menu' | 'contact';

interface AdvantageItem {
  id: number;
  title: string;
  description: string;
}

interface AtmosphereItem {
  id: number;
  title: string;
  description: string;
  image?: string;
}

interface MenuCategory {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image?: string;
}

interface StatItem {
  value: string;
  label: string;
  description: string;
}

export const AdminContent = () => {
  const [data, setData] = useState<SiteContent | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('hero');
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const content = await dataService.load();
      setData(content);
    };
    loadData();
  }, []);

  const handleSave = useCallback(async () => {
    if (data) {
      setIsSaving(true);
      await dataService.save(data);
      setIsSaving(false);
    }
  }, [data]);

  // Enable Ctrl+Enter to save
  useEnterSave(handleSave, !!data, isSaving);

  // Enable auto-save on paste
  usePasteAutoSave(handleSave, !!data, isSaving);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Image upload handler with auto-save
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldId: string,
    updateFn: (imagePath: string) => Partial<SiteContent>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;

    setUploadingField(fieldId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'content');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        const imagePath = result.key;
        const updates = updateFn(imagePath);
        const newData = { ...data, ...updates };
        setData(newData);

        // Auto-save after upload
        setIsSaving(true);
        await dataService.save(newData);
        setIsSaving(false);
      }
    } catch (error) {
      console.error('Image upload failed:', error);
    }
    setUploadingField(null);
  };

  if (!data) return <div className="text-white text-center py-12">Загрузка...</div>;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'hero', label: 'Главный экран' },
    { id: 'about', label: 'О нас' },
    { id: 'advantages', label: 'Преимущества' },
    { id: 'atmosphere', label: 'Атмосфера' },
    { id: 'menu', label: 'Меню' },
    { id: 'contact', label: 'Контакты' },
  ];

  return (
    <div className="text-white max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif font-bold">Управление контентом</h1>
        <GlowButton onClick={handleSave} disabled={isSaving}>
          <Save size={18} className="mr-2" />
          {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
        </GlowButton>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id 
                ? 'text-amber-500 border-b-2 border-amber-500' 
                : 'text-white/50 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Forms */}
      <div className="bg-zinc-900 p-8 rounded-xl border border-white/5">
        {/* Hero Tab */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Главный экран (Hero)</h2>
            <div>
              <label className="block text-sm text-white/50 mb-2">Заголовок</label>
              <input
                type="text"
                value={data.hero.title}
                onChange={(e) => setData({ ...data, hero: { ...data.hero, title: e.target.value } })}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Слоган</label>
              <input
                type="text"
                value={data.hero.slogan}
                onChange={(e) => setData({ ...data, hero: { ...data.hero, slogan: e.target.value } })}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Описание</label>
              <textarea
                value={data.hero.description}
                onChange={(e) => setData({ ...data, hero: { ...data.hero, description: e.target.value } })}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none h-24"
              />
            </div>
            {/* Hero Image */}
            <div>
              <label className="block text-sm text-white/50 mb-2">Фоновое изображение</label>
              <div className="flex items-start gap-4">
                {data.hero.image && (
                  <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-white/10">
                    <img
                      src={data.hero.image}
                      alt="Hero preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2 bg-black border border-white/10 rounded-lg cursor-pointer hover:border-amber-500 transition-colors">
                  {uploadingField === 'hero-image' ? (
                    <span className="text-white/50">Загрузка...</span>
                  ) : (
                    <>
                      <Upload size={16} className="text-amber-500" />
                      <span className="text-white text-sm">{data.hero.image ? 'Заменить' : 'Загрузить'}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'hero-image', (imagePath) => ({
                      hero: { ...data.hero, image: imagePath }
                    }))}
                    disabled={uploadingField === 'hero-image'}
                  />
                </label>
              </div>
              {data.hero.image && (
                <p className="text-xs text-white/30 mt-2">{data.hero.image}</p>
              )}
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Секция «О нас»</h2>
            <div>
              <label className="block text-sm text-white/50 mb-2">Заголовок секции</label>
              <input
                type="text"
                value={data.about?.title || ''}
                onChange={(e) => setData({ 
                  ...data, 
                  about: { ...data.about, title: e.target.value } 
                })}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Первый абзац</label>
              <textarea
                value={data.about?.description1 || ''}
                onChange={(e) => setData({ 
                  ...data, 
                  about: { ...data.about, description1: e.target.value } 
                })}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none h-32"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Второй абзац</label>
              <textarea
                value={data.about?.description2 || ''}
                onChange={(e) => setData({
                  ...data,
                  about: { ...data.about, description2: e.target.value }
                })}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none h-32"
              />
            </div>
            {/* About Image */}
            <div>
              <label className="block text-sm text-white/50 mb-2">Изображение секции</label>
              <div className="flex items-start gap-4">
                {data.about?.image && (
                  <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-white/10">
                    <img
                      src={data.about.image}
                      alt="About preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2 bg-black border border-white/10 rounded-lg cursor-pointer hover:border-amber-500 transition-colors">
                  {uploadingField === 'about-image' ? (
                    <span className="text-white/50">Загрузка...</span>
                  ) : (
                    <>
                      <Upload size={16} className="text-amber-500" />
                      <span className="text-white text-sm">{data.about?.image ? 'Заменить' : 'Загрузить'}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'about-image', (imagePath) => ({
                      about: { ...data.about, image: imagePath }
                    }))}
                    disabled={uploadingField === 'about-image'}
                  />
                </label>
              </div>
              {data.about?.image && (
                <p className="text-xs text-white/30 mt-2">{data.about.image}</p>
              )}
            </div>

            {/* Stats */}
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-lg font-bold mb-4">Статистика / Цифры</h3>
              {data.about?.stats?.map((stat: StatItem, index: number) => (
                <div 
                  key={index} 
                  className="mb-4 p-4 bg-black/50 rounded-lg border border-white/5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-amber-500 font-medium">Элемент #{index + 1}</span>
                    <button
                      onClick={() => toggleSection(`stat-${index}`)}
                      className="text-white/50 hover:text-white"
                    >
                      {expandedSections[`stat-${index}`] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                  {(expandedSections[`stat-${index}`] !== false) && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Значение</label>
                        <input
                          type="text"
                          value={stat.value}
                          onChange={(e) => {
                            const newStats = [...(data.about?.stats || [])];
                            newStats[index] = { ...newStats[index], value: e.target.value };
                            setData({ ...data, about: { ...data.about, stats: newStats } });
                          }}
                          className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500 outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Подпись</label>
                        <input
                          type="text"
                          value={stat.label}
                          onChange={(e) => {
                            const newStats = [...(data.about?.stats || [])];
                            newStats[index] = { ...newStats[index], label: e.target.value };
                            setData({ ...data, about: { ...data.about, stats: newStats } });
                          }}
                          className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500 outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Описание</label>
                        <textarea
                          value={stat.description}
                          onChange={(e) => {
                            const newStats = [...(data.about?.stats || [])];
                            newStats[index] = { ...newStats[index], description: e.target.value };
                            setData({ ...data, about: { ...data.about, stats: newStats } });
                          }}
                          className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500 outline-none text-sm h-20"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advantages Tab */}
        {activeTab === 'advantages' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Преимущества</h2>
            <div>
              <label className="block text-sm text-white/50 mb-2">Заголовок секции</label>
              <input
                type="text"
                value={data.advantages?.title || ''}
                onChange={(e) => setData({ 
                  ...data, 
                  advantages: { ...data.advantages, title: e.target.value } 
                })}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Подзаголовок</label>
              <input
                type="text"
                value={data.advantages?.subtitle || ''}
                onChange={(e) => setData({ 
                  ...data, 
                  advantages: { ...data.advantages, subtitle: e.target.value } 
                })}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
              />
            </div>

            <div className="pt-4 border-t border-white/10">
              <h3 className="text-lg font-bold mb-4">Элементы преимуществ</h3>
              {data.advantages?.items?.map((item: AdvantageItem, index: number) => (
                <div 
                  key={item.id} 
                  className="mb-4 p-4 bg-black/50 rounded-lg border border-white/5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-amber-500 font-medium">#{item.id} — {item.title}</span>
                    <button
                      onClick={() => toggleSection(`adv-${item.id}`)}
                      className="text-white/50 hover:text-white"
                    >
                      {expandedSections[`adv-${item.id}`] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                  {(expandedSections[`adv-${item.id}`] !== false) && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Заголовок</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const newItems = [...(data.advantages?.items || [])];
                            newItems[index] = { ...newItems[index], title: e.target.value };
                            setData({ ...data, advantages: { ...data.advantages, items: newItems } });
                          }}
                          className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500 outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Описание</label>
                        <textarea
                          value={item.description}
                          onChange={(e) => {
                            const newItems = [...(data.advantages?.items || [])];
                            newItems[index] = { ...newItems[index], description: e.target.value };
                            setData({ ...data, advantages: { ...data.advantages, items: newItems } });
                          }}
                          className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500 outline-none text-sm h-24"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Atmosphere Tab */}
        {activeTab === 'atmosphere' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Атмосфера</h2>
            <div>
              <label className="block text-sm text-white/50 mb-2">Заголовок секции</label>
              <input
                type="text"
                value={data.atmosphere?.title || ''}
                onChange={(e) => setData({ 
                  ...data, 
                  atmosphere: { ...data.atmosphere, title: e.target.value } 
                })}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Подзаголовок</label>
              <textarea
                value={data.atmosphere?.subtitle || ''}
                onChange={(e) => setData({ 
                  ...data, 
                  atmosphere: { ...data.atmosphere, subtitle: e.target.value } 
                })}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none h-20"
              />
            </div>

            <div className="pt-4 border-t border-white/10">
              <h3 className="text-lg font-bold mb-4">Элементы галереи атмосферы</h3>
              {data.atmosphere?.items?.map((item: AtmosphereItem, index: number) => (
                <div 
                  key={item.id} 
                  className="mb-4 p-4 bg-black/50 rounded-lg border border-white/5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-amber-500 font-medium">#{item.id} — {item.title}</span>
                    <button
                      onClick={() => toggleSection(`atm-${item.id}`)}
                      className="text-white/50 hover:text-white"
                    >
                      {expandedSections[`atm-${item.id}`] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                  {(expandedSections[`atm-${item.id}`] !== false) && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Заголовок</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const newItems = [...(data.atmosphere?.items || [])];
                            newItems[index] = { ...newItems[index], title: e.target.value };
                            setData({ ...data, atmosphere: { ...data.atmosphere, items: newItems } });
                          }}
                          className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500 outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Описание</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const newItems = [...(data.atmosphere?.items || [])];
                            newItems[index] = { ...newItems[index], description: e.target.value };
                            setData({ ...data, atmosphere: { ...data.atmosphere, items: newItems } });
                          }}
                          className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500 outline-none text-sm"
                        />
                      </div>
                      {/* Atmosphere Item Image */}
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Изображение</label>
                        <div className="flex items-start gap-3">
                          {item.image && (
                            <div className="relative w-20 h-14 rounded overflow-hidden border border-white/10">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <label className="flex items-center gap-2 px-3 py-1.5 bg-black border border-white/10 rounded cursor-pointer hover:border-amber-500 transition-colors">
                            {uploadingField === `atm-image-${item.id}` ? (
                              <span className="text-white/50 text-xs">Загрузка...</span>
                            ) : (
                              <>
                                <Upload size={14} className="text-amber-500" />
                                <span className="text-white text-xs">{item.image ? 'Заменить' : 'Загрузить'}</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, `atm-image-${item.id}`, (imagePath) => {
                                const newItems = [...(data.atmosphere?.items || [])];
                                newItems[index] = { ...newItems[index], image: imagePath };
                                return { atmosphere: { ...data.atmosphere, items: newItems } };
                              })}
                              disabled={uploadingField === `atm-image-${item.id}`}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Категории меню</h2>
            <p className="text-white/50 text-sm mb-4">
              Редактируйте заголовки и описания для секций меню на главной странице
            </p>

            {data.menuCategories?.map((category: MenuCategory, index: number) => (
              <div 
                key={category.id} 
                className="mb-4 p-4 bg-black/50 rounded-lg border border-white/5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-amber-500 font-medium">{category.title}</span>
                  <button
                    onClick={() => toggleSection(`menu-${category.id}`)}
                    className="text-white/50 hover:text-white"
                  >
                    {expandedSections[`menu-${category.id}`] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
                {(expandedSections[`menu-${category.id}`] !== false) && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Заголовок</label>
                      <input
                        type="text"
                        value={category.title}
                        onChange={(e) => {
                          const newCategories = [...(data.menuCategories || [])];
                          newCategories[index] = { ...newCategories[index], title: e.target.value };
                          setData({ ...data, menuCategories: newCategories });
                        }}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Подзаголовок</label>
                      <input
                        type="text"
                        value={category.subtitle}
                        onChange={(e) => {
                          const newCategories = [...(data.menuCategories || [])];
                          newCategories[index] = { ...newCategories[index], subtitle: e.target.value };
                          setData({ ...data, menuCategories: newCategories });
                        }}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Описание</label>
                      <textarea
                        value={category.description}
                        onChange={(e) => {
                          const newCategories = [...(data.menuCategories || [])];
                          newCategories[index] = { ...newCategories[index], description: e.target.value };
                          setData({ ...data, menuCategories: newCategories });
                        }}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500 outline-none text-sm h-24"
                      />
                    </div>
                    {/* Menu Category Image */}
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Изображение</label>
                      <div className="flex items-start gap-3">
                        {category.image && (
                          <div className="relative w-20 h-14 rounded overflow-hidden border border-white/10">
                            <img
                              src={category.image}
                              alt={category.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <label className="flex items-center gap-2 px-3 py-1.5 bg-black border border-white/10 rounded cursor-pointer hover:border-amber-500 transition-colors">
                          {uploadingField === `menu-image-${category.id}` ? (
                            <span className="text-white/50 text-xs">Загрузка...</span>
                          ) : (
                            <>
                              <Upload size={14} className="text-amber-500" />
                              <span className="text-white text-xs">{category.image ? 'Заменить' : 'Загрузить'}</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, `menu-image-${category.id}`, (imagePath) => {
                              const newCategories = [...(data.menuCategories || [])];
                              newCategories[index] = { ...newCategories[index], image: imagePath };
                              return { menuCategories: newCategories };
                            })}
                            disabled={uploadingField === `menu-image-${category.id}`}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Контактная информация</h2>
            <div>
              <label className="block text-sm text-white/50 mb-2">Телефон</label>
              <input
                type="text"
                value={data.contact.phone}
                onChange={(e) => setData({ ...data, contact: { ...data.contact, phone: e.target.value } })}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Адрес</label>
              <input
                type="text"
                value={data.contact.address}
                onChange={(e) => setData({ ...data, contact: { ...data.contact, address: e.target.value } })}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Email</label>
              <input
                type="text"
                value={data.contact.email}
                onChange={(e) => setData({ ...data, contact: { ...data.contact, email: e.target.value } })}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-lg font-bold mb-4">Социальные сети</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/50 mb-2">Instagram</label>
                  <input
                    type="text"
                    value={data.contact.socials.instagram}
                    onChange={(e) => setData({ ...data, contact: { ...data.contact, socials: { ...data.contact.socials, instagram: e.target.value } } })}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-2">Telegram</label>
                  <input
                    type="text"
                    value={data.contact.socials.telegram}
                    onChange={(e) => setData({ ...data, contact: { ...data.contact, socials: { ...data.contact.socials, telegram: e.target.value } } })}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-2">WhatsApp</label>
                  <input
                    type="text"
                    value={data.contact.socials.whatsapp || ''}
                    onChange={(e) => setData({ ...data, contact: { ...data.contact, socials: { ...data.contact.socials, whatsapp: e.target.value } } })}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-2">YouTube</label>
                  <input
                    type="text"
                    value={data.contact.socials.youtube || ''}
                    onChange={(e) => setData({ ...data, contact: { ...data.contact, socials: { ...data.contact.socials, youtube: e.target.value } } })}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-2">TikTok</label>
                  <input
                    type="text"
                    value={data.contact.socials.tiktok || ''}
                    onChange={(e) => setData({ ...data, contact: { ...data.contact, socials: { ...data.contact.socials, tiktok: e.target.value } } })}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <p className="text-amber-500/80 text-sm">
          <strong>Совет:</strong> Нажмите <kbd className="px-1.5 py-0.5 bg-black/30 rounded text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-black/30 rounded text-xs">Enter</kbd> для быстрого сохранения.
          Для управления локациями и новостями используйте соответствующие разделы в меню.
        </p>
      </div>
    </div>
  );
};
