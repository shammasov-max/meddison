import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Check } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  placeholder?: string;
  className?: string;
  hideUrlInput?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  folder = 'seo',
  placeholder = 'Загрузить изображение (1200x630 рекомендуется)',
  className = '',
  hideUrlInput = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Только изображения (JPG, PNG, WebP, GIF)');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Максимальный размер файла: 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Create FormData with file and folder
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      setUploadProgress(30);

      // Upload directly to local API
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка загрузки файла');
      }

      setUploadProgress(70);

      const { publicUrl } = await uploadRes.json();
      onChange(publicUrl);

      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Ошибка загрузки');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleClear = () => {
    onChange('');
    setError(null);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Check if value is a valid URL for preview (supports http, data:, and relative paths)
  const isValidUrl = value && (value.startsWith('http') || value.startsWith('data:') || value.startsWith('/'));
  const showPreview = value && isValidUrl;

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {showPreview ? (
        <div className="relative group">
          <img
            src={value}
            alt="OG Image Preview"
            className="w-full h-32 object-cover rounded-lg border border-white/10"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleClick}
              className="p-2 bg-amber-500 rounded-lg text-black hover:bg-amber-400 transition"
            >
              <Upload size={16} />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-400 transition"
            >
              <X size={16} />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-green-400 flex items-center gap-1">
            <Check size={12} />
            Загружено
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            w-full h-32 border-2 border-dashed rounded-lg cursor-pointer
            flex flex-col items-center justify-center gap-2 transition-all
            ${isDragging 
              ? 'border-amber-500 bg-amber-500/10' 
              : 'border-white/20 hover:border-white/40 bg-black/30'
            }
            ${isUploading ? 'pointer-events-none' : ''}
          `}
        >
          {isUploading ? (
            <>
              <Loader2 size={24} className="text-amber-500 animate-spin" />
              <span className="text-sm text-white/50">Загрузка... {uploadProgress}%</span>
              <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <ImageIcon size={24} className="text-white/40" />
              <span className="text-sm text-white/50 text-center px-4">{placeholder}</span>
              <span className="text-xs text-white/30">Перетащите или нажмите</span>
            </>
          )}
        </div>
      )}

      {/* URL Input for manual entry */}
      {!hideUrlInput && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Или введите URL изображения"
            className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none"
          />
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};
