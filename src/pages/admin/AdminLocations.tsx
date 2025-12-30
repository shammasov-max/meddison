import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Save, X, Image as ImageIcon, Upload, Link as LinkIcon, Minus, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { GlowButton } from '../../components/ui/GlowButton';
import { useEnterSave } from '../../hooks/useEnterSave';
import { usePasteAutoSave } from '../../hooks/usePasteAutoSave';
import type { Location, LocationFeature, LocationSocialLinks } from '../../types';

export const AdminLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<Location>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setIsLoading(true);
    const data = await dataService.load();
    setLocations(data.locations);
    setIsLoading(false);
  };

  const handleEdit = (item: Location) => {
    setCurrentItem({ ...item });
    setIsEditing(true);
  };

  const handleAdd = () => {
    setCurrentItem({
      gallery: [],
      features: [],
      comingSoon: false,
      sortOrder: locations.length + 1,
      socialLinks: { telegram: '', instagram: '', whatsapp: '' },
      coordinates: ''
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту локацию?')) {
      const data = await dataService.load();
      const updatedLocations = data.locations.filter(loc => loc.id !== id);
      await dataService.save({ ...data, locations: updatedLocations });
      loadLocations();
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const doSave = useCallback(async () => {
    if (!currentItem.name) return;

    const item = { ...currentItem };
    if (!item.slug) {
      item.slug = item.name!.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }

    setIsSaving(true);
    const data = await dataService.load();
    let updatedLocations: Location[];

    if (item.id) {
      // Update existing
      updatedLocations = data.locations.map(loc =>
        loc.id === item.id ? { ...loc, ...item } as Location : loc
      );
    } else {
      // Add new
      const newId = Math.max(...data.locations.map(l => l.id), 0) + 1;
      updatedLocations = [...data.locations, { ...item, id: newId } as Location];
    }

    await dataService.save({ ...data, locations: updatedLocations });
    setIsSaving(false);
    setIsEditing(false);
    loadLocations();
  }, [currentItem]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await doSave();
    window.alert('Данные успешно сохранены!');
  };

  // Enable Ctrl+Enter to save when editing
  useEnterSave(doSave, isEditing && !!currentItem.name, isSaving);

  // Enable auto-save on paste when editing
  usePasteAutoSave(doSave, isEditing && !!currentItem.name, isSaving);

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'locations');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload file');
      const { publicUrl } = await res.json();

      return publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Ошибка загрузки изображения');
      return null;
    }
  };

  // Auto-save helper for image operations
  const saveImageChanges = async (updatedItem: Partial<Location>) => {
    if (!updatedItem.id || !updatedItem.name) return;

    setIsSaving(true);
    try {
      const data = await dataService.load();
      const updatedLocations = data.locations.map(loc =>
        loc.id === updatedItem.id ? { ...loc, ...updatedItem } as Location : loc
      );
      await dataService.save({ ...data, locations: updatedLocations });
      // Update local state
      setLocations(updatedLocations);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
    setIsSaving(false);
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const result = await uploadFile(file);
    if (result) {
      const updatedItem = {
        ...currentItem,
        image: result
      };
      setCurrentItem(updatedItem);
      // Auto-save after upload
      await saveImageChanges(updatedItem);
    }
    setIsUploading(false);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);

    const newKeys: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const result = await uploadFile(files[i]);
      if (result) {
        newKeys.push(result);
      }
    }

    const updatedItem = {
      ...currentItem,
      gallery: [...(currentItem.gallery || []), ...newKeys]
    };
    setCurrentItem(updatedItem);
    // Auto-save after upload
    await saveImageChanges(updatedItem);
    setIsUploading(false);
  };

  const removeGalleryImage = async (index: number) => {
    const updatedItem = {
      ...currentItem,
      gallery: currentItem.gallery?.filter((_, i) => i !== index)
    };
    setCurrentItem(updatedItem);
    // Auto-save after removal
    await saveImageChanges(updatedItem);
  };

  const addFeature = () => {
    setCurrentItem(prev => ({
      ...prev,
      features: [...(prev.features || []), { icon: 'Star', title: '', desc: '' }]
    }));
  };

  const updateFeature = (index: number, field: keyof LocationFeature, value: string) => {
    const newFeatures = [...(currentItem.features || [])];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setCurrentItem(prev => ({ ...prev, features: newFeatures }));
  };

  const removeFeature = (index: number) => {
    setCurrentItem(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index)
    }));
  };

  if (isEditing) {
    return (
      <div className="text-white max-w-4xl mx-auto pb-20">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif font-bold">
            {currentItem.id ? 'Редактировать локацию' : 'Добавить локацию'}
          </h1>
          <button 
            onClick={() => setIsEditing(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-8 bg-zinc-900 p-8 rounded-xl border border-white/5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-white/50 mb-2">Название</label>
              <input
                type="text"
                value={currentItem.name || ''}
                onChange={e => setCurrentItem({...currentItem, name: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Slug (URL)</label>
              <input
                type="text"
                value={currentItem.slug || ''}
                onChange={e => setCurrentItem({...currentItem, slug: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
                placeholder="auto-generated"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Адрес</label>
              <input
                type="text"
                value={currentItem.address || ''}
                onChange={e => setCurrentItem({...currentItem, address: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Телефон</label>
              <input
                type="text"
                value={currentItem.phone || ''}
                onChange={e => setCurrentItem({...currentItem, phone: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Режим работы</label>
              <input
                type="text"
                value={currentItem.hours || ''}
                onChange={e => setCurrentItem({...currentItem, hours: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Ссылка на меню</label>
              <input
                type="text"
                value={currentItem.menuLink || ''}
                onChange={e => setCurrentItem({...currentItem, menuLink: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Status and Sort Order */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-zinc-800 rounded-lg border border-white/10">
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentItem.comingSoon || false}
                  onChange={e => setCurrentItem({...currentItem, comingSoon: e.target.checked})}
                  className="w-5 h-5 rounded bg-black border-white/20 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <span className="text-white font-medium flex items-center gap-2">
                    <Clock size={16} className="text-amber-500" />
                    Скоро открытие
                  </span>
                  <p className="text-xs text-white/50 mt-1">
                    Показывает плашку "Скоро открытие" и блокирует переход на страницу локации
                  </p>
                </div>
              </label>
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Порядок сортировки</label>
              <input
                type="number"
                min="1"
                value={currentItem.sortOrder || 1}
                onChange={e => setCurrentItem({...currentItem, sortOrder: parseInt(e.target.value) || 1})}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
              />
              <p className="text-xs text-white/40 mt-1">Чем меньше число, тем выше в списке</p>
            </div>
          </div>

          {/* Social Links */}
          <div className="p-4 bg-zinc-800 rounded-lg border border-white/10">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <LinkIcon size={16} className="text-amber-500" />
              Социальные сети и связь
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-white/50 mb-2">
                  <span className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-sky-400" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
                    Telegram
                  </span>
                </label>
                <input
                  type="text"
                  value={currentItem.socialLinks?.telegram || ''}
                  onChange={e => setCurrentItem({...currentItem, socialLinks: {...currentItem.socialLinks, telegram: e.target.value}})}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
                  placeholder="@username или ссылка"
                />
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-2">
                  <span className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-pink-500" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    Instagram
                  </span>
                </label>
                <input
                  type="text"
                  value={currentItem.socialLinks?.instagram || ''}
                  onChange={e => setCurrentItem({...currentItem, socialLinks: {...currentItem.socialLinks, instagram: e.target.value}})}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
                  placeholder="@username или ссылка"
                />
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-2">
                  <span className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-green-500" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </span>
                </label>
                <input
                  type="text"
                  value={currentItem.socialLinks?.whatsapp || ''}
                  onChange={e => setCurrentItem({...currentItem, socialLinks: {...currentItem.socialLinks, whatsapp: e.target.value}})}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
                  placeholder="+7XXXXXXXXXX"
                />
              </div>
            </div>
          </div>

          {/* Coordinates for Route */}
          <div>
            <label className="block text-sm text-white/50 mb-2 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-amber-500" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              Координаты для маршрута (Яндекс Карты)
            </label>
            <input
              type="text"
              value={currentItem.coordinates || ''}
              onChange={e => setCurrentItem({...currentItem, coordinates: e.target.value})}
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
              placeholder="55.123456,37.123456 (широта,долгота)"
            />
            <p className="text-xs text-white/40 mt-1">Введите координаты для кнопки "Доехать" (можно найти в Яндекс Картах)</p>
          </div>

          {/* Descriptions */}
          <div>
            <label className="block text-sm text-white/50 mb-2">Краткое описание</label>
            <textarea
              value={currentItem.description || ''}
              onChange={e => setCurrentItem({...currentItem, description: e.target.value})}
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none h-20"
            />
          </div>
          <div>
            <label className="block text-sm text-white/50 mb-2">Полное описание</label>
            <textarea
              value={currentItem.fullDescription || ''}
              onChange={e => setCurrentItem({...currentItem, fullDescription: e.target.value})}
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none h-32"
            />
          </div>

          {/* Main Image */}
          <div>
            <label className="block text-sm text-white/50 mb-2">Главное изображение</label>
            <div className="flex gap-4 items-start">
              <div className="w-32 h-20 bg-black border border-white/10 rounded-lg overflow-hidden flex items-center justify-center">
                {currentItem.image && currentItem.image.startsWith('http') ? (
                  <img src={currentItem.image} alt="Main" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-white/20" />
                )}
              </div>
              <div className="flex-grow">
                <input
                  type="text"
                  value={currentItem.image || ''}
                  onChange={e => setCurrentItem({...currentItem, image: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none mb-2"
                  placeholder="URL или путь к файлу"
                />
                <label className="inline-flex items-center gap-2 cursor-pointer select-none bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors text-sm">
                  <Upload size={16} />
                  Загрузить файл
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleMainImageUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Gallery */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm text-white/50">Галерея</label>
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-amber-500 hover:text-amber-400 text-sm">
                <Plus size={16} />
                Добавить фото
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentItem.gallery?.map((img, idx) => (
                <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden bg-black border border-white/10">
                  <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(idx)}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm text-white/50">Особенности</label>
              <button
                type="button"
                onClick={addFeature}
                className="flex items-center gap-2 text-amber-500 hover:text-amber-400 text-sm"
              >
                <Plus size={16} />
                Добавить особенность
              </button>
            </div>
            <div className="space-y-4">
              {currentItem.features?.map((feature, idx) => (
                <div key={idx} className="flex gap-4 items-start bg-black/30 p-4 rounded-lg border border-white/5">
                  <div className="w-1/4">
                    <input
                      type="text"
                      value={feature.icon}
                      onChange={e => updateFeature(idx, 'icon', e.target.value)}
                      className="w-full bg-black border border-white/10 rounded px-3 py-1 text-sm text-white focus:border-amber-500 outline-none"
                      placeholder="Icon Name (e.g. Wifi)"
                    />
                  </div>
                  <div className="w-1/4">
                    <input
                      type="text"
                      value={feature.title}
                      onChange={e => updateFeature(idx, 'title', e.target.value)}
                      className="w-full bg-black border border-white/10 rounded px-3 py-1 text-sm text-white focus:border-amber-500 outline-none"
                      placeholder="Заголовок"
                    />
                  </div>
                  <div className="w-1/2">
                    <input
                      type="text"
                      value={feature.desc}
                      onChange={e => updateFeature(idx, 'desc', e.target.value)}
                      className="w-full bg-black border border-white/10 rounded px-3 py-1 text-sm text-white focus:border-amber-500 outline-none"
                      placeholder="Описание"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFeature(idx)}
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-4">
            <p className="text-xs text-white/40">
              <kbd className="px-1.5 py-0.5 bg-black/30 rounded text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-black/30 rounded text-xs">Enter</kbd> для быстрого сохранения
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
              >
                Отмена
              </button>
              <GlowButton disabled={isSaving}>
                <Save size={18} className="mr-2" />
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </GlowButton>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif font-bold">Локации</h1>
        <GlowButton onClick={handleAdd}>
          <Plus size={20} className="mr-2" />
          Добавить локацию
        </GlowButton>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-white/50">Загрузка...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {locations
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map(item => (
            <div
              key={item.id}
              onClick={() => handleEdit(item)}
              className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden group hover:border-amber-500/30 transition-colors relative cursor-pointer"
            >
              {item.comingSoon && (
                <div className="absolute top-4 left-4 z-10 bg-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Clock size={12} />
                  Скоро открытие
                </div>
              )}
              <div className="h-48 overflow-hidden relative">
                <img src={item.image} alt={item.name} className={`w-full h-full object-cover ${item.comingSoon ? 'grayscale-[0.3]' : ''}`} />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                    className="p-2 bg-black/50 backdrop-blur-md rounded-lg text-white hover:bg-amber-500 hover:text-black transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    className="p-2 bg-black/50 backdrop-blur-md rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                <p className="text-white/60 text-sm mb-4 line-clamp-2">{item.description}</p>
                <div className="text-xs text-white/40 space-y-1">
                  <div>{item.address}</div>
                  <div>{item.phone}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
