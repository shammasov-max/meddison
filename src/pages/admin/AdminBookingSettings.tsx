import React, { useState, useEffect, useCallback } from 'react';
import { GlowButton } from '../../components/ui/GlowButton';
import { Save, Clock, Users, Phone, Mail, FileText, Image, Building, MapPin, MessageCircle, CheckCircle, XCircle, Send, RefreshCw, Loader2 } from 'lucide-react';
import { useEnterSave } from '../../hooks/useEnterSave';
import { usePasteAutoSave } from '../../hooks/usePasteAutoSave';

const API_URL = '/api/booking-settings';
const ALL_SETTINGS_URL = '/api/booking-settings/all';
const TELEGRAM_STATUS_URL = '/api/telegram/status';
const TELEGRAM_VALIDATE_URL = '/api/telegram/validate';
const TELEGRAM_TEST_MESSAGE_URL = '/api/telegram/test-message';

interface TelegramStatus {
  configured: boolean;
  polling: boolean;
  token: string | null;
  chatId: string | null;
}

interface BookingSettings {
  id: number;
  location_slug: string | null;
  title: string;
  description: string;
  image: string | null;
  working_hours_start: string;
  working_hours_end: string;
  time_slot_interval: number;
  max_guests: number;
  min_guests: number;
  booking_rules: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  telegram_chat_id: string | null;
  telegram_bot_token: string | null;
}

interface LocationOption {
  slug: string;
  name: string;
}

const defaultSettings: BookingSettings = {
  id: 1,
  location_slug: 'all',
  title: 'Medisson Lounge',
  description: 'Создаем атмосферу, в которую хочется возвращаться.',
  image: null,
  working_hours_start: '11:00',
  working_hours_end: '05:00',
  time_slot_interval: 30,
  max_guests: 20,
  min_guests: 1,
  booking_rules: null,
  contact_phone: null,
  contact_email: null,
  telegram_chat_id: null,
  telegram_bot_token: null
};

export const AdminBookingSettings = () => {
  const [allSettings, setAllSettings] = useState<BookingSettings[]>([]);
  const [selectedLocationSlug, setSelectedLocationSlug] = useState<string>('all');
  const [settings, setSettings] = useState<BookingSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Telegram state
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [tokenValidation, setTokenValidation] = useState<{ valid: boolean; botName?: string; error?: string } | null>(null);
  const [isSendingTestMessage, setIsSendingTestMessage] = useState(false);
  const [testMessageResult, setTestMessageResult] = useState<{ ok: boolean; error?: string } | null>(null);

  const locationOptions: LocationOption[] = [
    { slug: 'all', name: 'Общие настройки (все заведения)' },
    { slug: 'butovo', name: 'Medisson «Бутово»' },
    { slug: 'select', name: 'Medisson Select' }
  ];

  // Determine if we're on the general settings tab
  const isGeneralSettings = selectedLocationSlug === 'all';

  useEffect(() => {
    fetchAllSettings();
    fetchTelegramStatus();
  }, []);
  
  useEffect(() => {
    // When location changes, find settings for that location
    const locationSettings = allSettings.find(s => s.location_slug === selectedLocationSlug);
    if (locationSettings) {
      setSettings(locationSettings);
    } else {
      // Create new settings based on defaults
      setSettings({
        ...defaultSettings,
        id: 0, // Will be handled by backend
        location_slug: selectedLocationSlug,
        title: locationOptions.find(l => l.slug === selectedLocationSlug)?.name || 'Medisson Lounge'
      });
    }
  }, [selectedLocationSlug, allSettings]);

  const fetchAllSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(ALL_SETTINGS_URL);
      if (response.ok) {
        const data = await response.json();
        setAllSettings(data);
        // Set initial selection
        if (data.length > 0) {
          const defaultItem = data.find((s: BookingSettings) => s.location_slug === 'all') || data[0];
          setSelectedLocationSlug(defaultItem.location_slug || 'all');
          setSettings(defaultItem);
        }
      } else {
        console.error('Failed to fetch all booking settings:', response.status);
        setError('Не удалось загрузить настройки');
      }
    } catch (err) {
      console.error('Error fetching booking settings:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTelegramStatus = async () => {
    try {
      const response = await fetch(TELEGRAM_STATUS_URL);
      if (response.ok) {
        const data = await response.json();
        setTelegramStatus(data);
      }
    } catch (err) {
      console.error('Error fetching Telegram status:', err);
    }
  };

  const validateToken = async () => {
    if (!settings.telegram_bot_token) return;

    setIsValidatingToken(true);
    setTokenValidation(null);
    try {
      const response = await fetch(TELEGRAM_VALIDATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: settings.telegram_bot_token }),
      });
      const data = await response.json();
      setTokenValidation(data);
    } catch (err) {
      setTokenValidation({ valid: false, error: 'Ошибка проверки' });
    } finally {
      setIsValidatingToken(false);
    }
  };

  const sendTestMessage = async () => {
    if (!settings.telegram_chat_id) return;

    setIsSendingTestMessage(true);
    setTestMessageResult(null);
    try {
      const response = await fetch(TELEGRAM_TEST_MESSAGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: settings.telegram_chat_id }),
      });
      const data = await response.json();
      setTestMessageResult(data);
    } catch (err) {
      setTestMessageResult({ ok: false, error: 'Ошибка отправки' });
    } finally {
      setIsSendingTestMessage(false);
    }
  };

  const doSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const saveUrl = settings.id ? `${API_URL}/${settings.id}` : API_URL;
      const response = await fetch(saveUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data });
        // Update allSettings array
        setAllSettings(prev => {
          const idx = prev.findIndex(s => s.id === data.id);
          if (idx >= 0) {
            const newArr = [...prev];
            newArr[idx] = data;
            return newArr;
          }
          return [...prev, data];
        });
        setSuccessMessage('Настройки успешно сохранены!');
        setTimeout(() => setSuccessMessage(null), 3000);

        // Refresh Telegram status after save (bot reconfigures automatically)
        setTimeout(() => fetchTelegramStatus(), 500);
      } else {
        const errorText = await response.text();
        console.error('Failed to save booking settings:', response.status, errorText);
        setError(`Ошибка сохранения: ${response.status}`);
      }
    } catch (err) {
      console.error('Error saving booking settings:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const handleSave = async () => {
    await doSave();
  };

  // Enable Ctrl+Enter to save
  useEnterSave(doSave, !isLoading, isSaving);

  // Enable auto-save on paste
  usePasteAutoSave(doSave, !isLoading, isSaving);

  const handleChange = (field: keyof BookingSettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="text-white text-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
        Загрузка настроек...
      </div>
    );
  }

  return (
    <div className="text-white max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif font-bold">Настройки бронирования</h1>
        <GlowButton onClick={handleSave} disabled={isSaving}>
          <Save size={18} className="mr-2" />
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </GlowButton>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-300">
          {successMessage}
        </div>
      )}

      <div className="space-y-8">
        {/* Location Selector */}
        <section className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-amber-500" />
            Выберите заведение
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {locationOptions.map((loc) => (
              <button
                key={loc.slug}
                type="button"
                onClick={() => setSelectedLocationSlug(loc.slug)}
                className={`py-4 px-4 rounded-xl text-left transition-all duration-200 ${
                  selectedLocationSlug === loc.slug
                    ? 'bg-amber-500 text-black font-bold shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                <div className="font-medium">{loc.name}</div>
                {allSettings.find(s => s.location_slug === loc.slug)?.telegram_chat_id && (
                  <div className="text-xs mt-1 opacity-70 flex items-center gap-1">
                    <MessageCircle size={12} />
                    TG настроен
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Telegram Settings Section */}
        <section className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageCircle size={20} className="text-blue-400" />
              Telegram уведомления
            </h2>
            {telegramStatus && (
              <div className="flex items-center gap-2">
                {telegramStatus.polling ? (
                  <span className="flex items-center gap-1.5 text-sm text-green-400">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Бот активен
                  </span>
                ) : telegramStatus.configured ? (
                  <span className="flex items-center gap-1.5 text-sm text-yellow-400">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                    Бот настроен
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-white/40">
                    <span className="w-2 h-2 bg-white/40 rounded-full" />
                    Не настроен
                  </span>
                )}
                <button
                  onClick={fetchTelegramStatus}
                  className="p-1 text-white/40 hover:text-white transition-colors"
                  title="Обновить статус"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            )}
          </div>

          {isGeneralSettings ? (
            // General settings: Only Bot Token
            <>
              <p className="text-white/50 text-sm mb-4">
                Укажите токен Telegram бота для отправки уведомлений о бронированиях. Один бот используется для всех локаций.
              </p>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Bot Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={settings.telegram_bot_token || ''}
                    onChange={(e) => {
                      handleChange('telegram_bot_token', e.target.value);
                      setTokenValidation(null);
                    }}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:border-blue-500/50 focus:outline-none transition-colors"
                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  />
                  <button
                    onClick={validateToken}
                    disabled={!settings.telegram_bot_token || isValidatingToken}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    title="Проверить токен"
                  >
                    {isValidatingToken ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : tokenValidation?.valid ? (
                      <CheckCircle size={16} className="text-green-400" />
                    ) : tokenValidation?.error ? (
                      <XCircle size={16} className="text-red-400" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                  </button>
                </div>
                {tokenValidation && (
                  <p className={`text-xs mt-1 ${tokenValidation.valid ? 'text-green-400' : 'text-red-400'}`}>
                    {tokenValidation.valid ? `✓ @${tokenValidation.botName}` : tokenValidation.error}
                  </p>
                )}
                <p className="text-xs text-white/30 mt-1">Токен от @BotFather</p>
              </div>

              {/* Status info */}
              {telegramStatus && (
                <div className="mt-4 p-3 bg-white/5 rounded-lg text-sm grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-white/40">Статус:</span>
                    <span className={`ml-2 ${telegramStatus.polling ? 'text-green-400' : 'text-white/60'}`}>
                      {telegramStatus.polling ? 'Активен' : 'Остановлен'}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40">Токен:</span>
                    <span className="ml-2 text-white/80">{telegramStatus.token || '—'}</span>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-white/5 rounded-lg text-sm text-white/50">
                <strong className="text-white/70">Как получить:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Создайте бота через @BotFather и получите токен</li>
                  <li>Добавьте бота в группы для каждой локации</li>
                  <li>Укажите Chat ID для каждой локации в соответствующей вкладке</li>
                </ol>
              </div>
            </>
          ) : (
            // Location settings: Only Chat ID
            <>
              <p className="text-white/50 text-sm mb-4">
                Укажите Chat ID группы, куда бот будет отправлять уведомления о бронированиях для этой локации.
              </p>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Chat ID (группа/канал)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.telegram_chat_id || ''}
                    onChange={(e) => {
                      handleChange('telegram_chat_id', e.target.value);
                      setTestMessageResult(null);
                    }}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:border-blue-500/50 focus:outline-none transition-colors"
                    placeholder="-1001234567890"
                  />
                  <button
                    onClick={sendTestMessage}
                    disabled={!settings.telegram_chat_id || !telegramStatus?.configured || isSendingTestMessage}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    title="Отправить тестовое сообщение"
                  >
                    {isSendingTestMessage ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : testMessageResult?.ok ? (
                      <CheckCircle size={16} className="text-green-400" />
                    ) : testMessageResult?.error ? (
                      <XCircle size={16} className="text-red-400" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
                {testMessageResult && (
                  <p className={`text-xs mt-1 ${testMessageResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                    {testMessageResult.ok ? '✓ Сообщение отправлено' : testMessageResult.error}
                  </p>
                )}
                <p className="text-xs text-white/30 mt-1">ID группы для уведомлений о бронях этой локации.</p>
              </div>

              <div className="mt-4 p-3 bg-white/5 rounded-lg text-sm text-white/50">
                <strong className="text-white/70">Как получить Chat ID:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Добавьте бота в нужную группу</li>
                  <li>Получите Chat ID через @userinfobot или @getidsbot</li>
                </ol>
              </div>
            </>
          )}
        </section>

        {/* Location-specific sections - only show for location tabs */}
        {!isGeneralSettings && (
          <>
        {/* Basic Info Section */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Building size={20} className="text-amber-500" />
            Информация о заведении
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Название заведения
              </label>
              <input
                type="text"
                value={settings.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none transition-colors"
                placeholder="Medisson Lounge"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Описание (отображается в модальном окне)
              </label>
              <textarea
                value={settings.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none transition-colors resize-none"
                placeholder="Создаем атмосферу, в которую хочется возвращаться."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
                <Image size={16} />
                URL фотографии
              </label>
              <input
                type="text"
                value={settings.image || ''}
                onChange={(e) => handleChange('image', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none transition-colors"
                placeholder="https://example.com/image.jpg"
              />
              {settings.image && (
                <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
                  <img 
                    src={settings.image} 
                    alt="Preview" 
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Working Hours Section */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock size={20} className="text-amber-500" />
            Часы работы
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Открытие
              </label>
              <select
                value={settings.working_hours_start}
                onChange={(e) => handleChange('working_hours_start', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-amber-500/50 focus:outline-none transition-colors"
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, '0');
                  return (
                    <option key={i} value={`${hour}:00`} className="bg-zinc-900">
                      {hour}:00
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Закрытие
              </label>
              <select
                value={settings.working_hours_end}
                onChange={(e) => handleChange('working_hours_end', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-amber-500/50 focus:outline-none transition-colors"
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, '0');
                  return (
                    <option key={i} value={`${hour}:00`} className="bg-zinc-900">
                      {hour}:00
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Интервал слотов (минуты)
              </label>
              <select
                value={settings.time_slot_interval}
                onChange={(e) => handleChange('time_slot_interval', parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-amber-500/50 focus:outline-none transition-colors"
              >
                <option value={15} className="bg-zinc-900">15 минут</option>
                <option value={30} className="bg-zinc-900">30 минут</option>
                <option value={60} className="bg-zinc-900">1 час</option>
              </select>
            </div>
          </div>

          <p className="mt-4 text-sm text-white/40">
            Текущие часы работы: {settings.working_hours_start} — {settings.working_hours_end}
          </p>
        </section>

        {/* Guest Settings Section */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Users size={20} className="text-amber-500" />
            Настройки гостей
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Минимум гостей
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={settings.min_guests}
                onChange={(e) => handleChange('min_guests', parseInt(e.target.value) || 1)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-amber-500/50 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Максимум гостей
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={settings.max_guests}
                onChange={(e) => handleChange('max_guests', parseInt(e.target.value) || 20)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-amber-500/50 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Booking Rules Section */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FileText size={20} className="text-amber-500" />
            Правила бронирования
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Текст правил (отображается для гостей)
            </label>
            <textarea
              value={settings.booking_rules || ''}
              onChange={(e) => handleChange('booking_rules', e.target.value)}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none transition-colors resize-none"
              placeholder="Бронирование за 30 минут до визита. При опоздании более 15 минут бронь снимается."
            />
          </div>
        </section>

        {/* Contact Info Section */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Phone size={20} className="text-amber-500" />
            Контактная информация
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
                <Phone size={14} />
                Телефон для бронирования
              </label>
              <input
                type="tel"
                value={settings.contact_phone || ''}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none transition-colors"
                placeholder="+7 (999) 123-45-67"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
                <Mail size={14} />
                Email для уведомлений
              </label>
              <input
                type="email"
                value={settings.contact_email || ''}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none transition-colors"
                placeholder="booking@medisson.ru"
              />
            </div>
          </div>
        </section>
          </>
        )}

        {/* Hint */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-amber-500/80 text-sm">
            <strong>Совет:</strong> Нажмите <kbd className="px-1.5 py-0.5 bg-black/30 rounded text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-black/30 rounded text-xs">Enter</kbd> для быстрого сохранения настроек.
          </p>
        </div>
      </div>
    </div>
  );
};
