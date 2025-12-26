import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Plus, Edit, Trash2, Save, X, Image as ImageIcon, Upload, Code, Eye } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { GlowButton } from '../../components/ui/GlowButton';
import { useEnterSave } from '../../hooks/useEnterSave';
import type { NewsItem } from '../../types';


// Extend NewsItem to include optional imageUrl from backend
interface ExtendedNewsItem extends NewsItem {
  imageUrl?: string;
}

export const AdminNews = () => {
  const [news, setNews] = useState<ExtendedNewsItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<ExtendedNewsItem>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [isUploadingContent, setIsUploadingContent] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  // Upload image and return URL
  const uploadImageToR2 = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'news-content');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload file');
      const { publicUrl } = await res.json();
      return publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      return null;
    }
  };

  // Custom image handler for Quill
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setIsUploadingContent(true);
      const imageUrl = await uploadImageToR2(file);
      setIsUploadingContent(false);

      if (imageUrl && quillRef.current) {
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection(true);
        editor.insertEmbed(range.index, 'image', imageUrl);
        editor.setSelection(range.index + 1, 0);
      } else {
        alert('Ошибка загрузки изображения');
      }
    };
  }, []);

  // Quill modules with custom toolbar
  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['blockquote', 'code-block'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), [imageHandler]);

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'align',
    'link', 'image', 'blockquote', 'code-block'
  ];

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setIsLoading(true);
    const data = await dataService.load();
    setNews(data.news);
    setIsLoading(false);
  };

  const handleEdit = (item: ExtendedNewsItem) => {
    setCurrentItem(item);
    setIsEditing(true);
    setShowSource(false);
  };

  const handleAdd = () => {
    setCurrentItem({
      date: new Date().toLocaleDateString('ru-RU'),
      category: 'Мероприятия',
      location: 'Все филиалы',
      image: '', 
      fullContent: ''
    });
    setIsEditing(true);
    setShowSource(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту новость?')) {
      const data = await dataService.load();
      const updatedNews = data.news.filter(item => item.id !== id);
      await dataService.save({ ...data, news: updatedNews });
      loadNews();
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const doSave = useCallback(async () => {
    if (!currentItem.title) return;

    const item = { ...currentItem };
    if (!item.slug) {
      item.slug = item.title!.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }

    setIsSaving(true);
    const data = await dataService.load();
    let updatedNews: NewsItem[];

    if (item.id) {
      // Update existing
      updatedNews = data.news.map(n =>
        n.id === item.id ? { ...n, ...item } as NewsItem : n
      );
    } else {
      // Add new
      const newId = Math.max(...data.news.map(n => n.id), 0) + 1;
      updatedNews = [...data.news, { ...item, id: newId } as NewsItem];
    }

    await dataService.save({ ...data, news: updatedNews });
    setIsSaving(false);
    setIsEditing(false);
    loadNews();
  }, [currentItem]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await doSave();
    window.alert('Данные успешно сохранены!');
  };

  // Enable Ctrl+Enter to save when editing
  useEnterSave(doSave, isEditing && !!currentItem.title, isSaving);

  // Auto-save helper for image operations
  const saveImageChanges = async (updatedItem: Partial<ExtendedNewsItem>) => {
    if (!updatedItem.id || !updatedItem.title) return;

    setIsSaving(true);
    try {
      const data = await dataService.load();
      const updatedNews = data.news.map(n =>
        n.id === updatedItem.id ? { ...n, ...updatedItem } as NewsItem : n
      );
      await dataService.save({ ...data, news: updatedNews });
      // Update local state
      setNews(updatedNews);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
    setIsSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'news');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload file');
      const { publicUrl } = await res.json();

      // Update state with the public URL
      const updatedItem = { ...currentItem, image: publicUrl };
      setCurrentItem(updatedItem);

      // Auto-save after upload
      await saveImageChanges(updatedItem);

    } catch (error) {
      console.error('Upload failed:', error);
      alert('Ошибка загрузки изображения');
    } finally {
      setIsUploading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="text-white max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif font-bold">
            {currentItem.id ? 'Редактировать новость' : 'Добавить новость'}
          </h1>
          <button 
            onClick={() => setIsEditing(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6 bg-zinc-900 p-8 rounded-xl border border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-white/50 mb-2">Заголовок</label>
              <input
                type="text"
                value={currentItem.title || ''}
                onChange={e => setCurrentItem({...currentItem, title: e.target.value})}
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
              <label className="block text-sm text-white/50 mb-2">Дата</label>
              <input
                type="text"
                value={currentItem.date || ''}
                onChange={e => setCurrentItem({...currentItem, date: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Категория</label>
              <select
                value={currentItem.category || ''}
                onChange={e => setCurrentItem({...currentItem, category: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
              >
                <option>Мероприятия</option>
                <option>Меню</option>
                <option>Акции</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Локация</label>
              <input
                type="text"
                value={currentItem.location || ''}
                onChange={e => setCurrentItem({...currentItem, location: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
              />
            </div>
            
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm text-white/50 mb-2">Изображение</label>
              <div className="flex gap-2">
                <div className="flex-grow relative">
                  <input
                    type="text"
                    value={currentItem.image || ''}
                    onChange={e => setCurrentItem({...currentItem, image: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none pr-10"
                    placeholder="URL или путь к файлу"
                  />
                  <label className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1 hover:bg-white/10 rounded transition-colors">
                    <Upload size={16} className="text-amber-500" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>
                <div className="w-10 h-10 bg-black border border-white/10 rounded flex items-center justify-center shrink-0 overflow-hidden">
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  ) : currentItem.imageUrl || (currentItem.image && currentItem.image.startsWith('http')) ? (
                    <img 
                      src={currentItem.imageUrl || currentItem.image} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <ImageIcon size={20} className="text-white/20" />
                  )}
                </div>
              </div>
              <p className="text-xs text-white/30 mt-1">
                Нажмите на иконку загрузки, чтобы выбрать файл с компьютера.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-2">Краткое описание</label>
            <textarea
              value={currentItem.description || ''}
              onChange={e => setCurrentItem({...currentItem, description: e.target.value})}
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none h-24"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-white/50">Полный контент</label>
              <button
                type="button"
                onClick={() => setShowSource(!showSource)}
                className="flex items-center gap-2 text-xs text-amber-500 hover:text-amber-400 transition-colors"
              >
                {showSource ? <><Eye size={14} /> Визуальный редактор</> : <><Code size={14} /> HTML код</>}
              </button>
            </div>
            
            <div className="bg-white text-black rounded-lg overflow-hidden relative">
              {isUploadingContent && (
                <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
                  <div className="flex items-center gap-3 bg-zinc-800 px-4 py-2 rounded-lg">
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-white text-sm">Загрузка изображения...</span>
                  </div>
                </div>
              )}
              {showSource ? (
                <textarea
                  value={currentItem.fullContent || ''}
                  onChange={e => setCurrentItem({...currentItem, fullContent: e.target.value})}
                  className="w-full h-64 p-4 bg-zinc-900 text-white font-mono text-sm outline-none resize-none"
                  placeholder="<div>Ваш HTML код...</div>"
                />
              ) : (
                <ReactQuill 
                  ref={quillRef}
                  theme="snow" 
                  value={currentItem.fullContent || ''} 
                  onChange={content => setCurrentItem({...currentItem, fullContent: content})}
                  modules={quillModules}
                  formats={quillFormats}
                  className="h-64 mb-12"
                />
              )}
            </div>
            <p className="text-xs text-white/40 mt-2">
              Для вставки изображения в текст нажмите кнопку "Изображение" на панели редактора.
            </p>
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
        <h1 className="text-3xl font-serif font-bold">Новости</h1>
        <GlowButton onClick={handleAdd}>
          <Plus size={20} className="mr-2" />
          Добавить новость
        </GlowButton>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-white/50">Загрузка...</div>
      ) : (
        <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-black/50 text-white/50 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Заголовок</th>
                <th className="p-4">Дата</th>
                <th className="p-4">Категория</th>
                <th className="p-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {news.map(item => (
                <tr key={item.id} onClick={() => handleEdit(item)} className="hover:bg-white/5 transition-colors cursor-pointer">
                  <td className="p-4 text-white/30">#{item.id}</td>
                  <td className="p-4 font-medium">{item.title}</td>
                  <td className="p-4 text-white/60">{item.date}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded text-xs font-bold uppercase">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                        className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
