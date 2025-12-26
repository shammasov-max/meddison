import React, { useEffect, useState } from 'react';
import { dataService } from '../../services/dataService';
import { FileText, MapPin, Utensils, Send, CheckCircle, AlertCircle, Loader2, Play, Square, Users, Bot } from 'lucide-react';

interface TelegramStatus {
  configured: boolean;
  polling: boolean;
  token: string | null;
  subscribersCount: number;
}

interface TelegramSubscriber {
  chatId: number;
  username?: string;
  firstName?: string;
  subscribedAt: string;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    newsCount: 0,
    locationsCount: 0,
    categoriesCount: 0,
  });
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(null);
  const [subscribers, setSubscribers] = useState<TelegramSubscriber[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      const data = await dataService.load();
      setStats({
        newsCount: data.news.length,
        locationsCount: data.locations.length,
        categoriesCount: data.menuCategories.length,
      });
    };
    loadStats();
    loadTelegramStatus();
  }, []);

  const loadTelegramStatus = async () => {
    try {
      const [statusRes, subsRes] = await Promise.all([
        fetch('/api/telegram/status'),
        fetch('/api/telegram/subscribers'),
      ]);
      const status = await statusRes.json();
      const subs = await subsRes.json();
      setTelegramStatus(status);
      setSubscribers(subs);
    } catch (error) {
      console.error('Failed to load telegram status:', error);
    }
  };

  const startPolling = async () => {
    setActionLoading('start');
    setMessage(null);
    try {
      const response = await fetch('/api/telegram/start', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Polling запущен! Бот принимает сообщения.' });
        await loadTelegramStatus();
      } else {
        setMessage({ type: 'error', text: 'Не удалось запустить polling. Проверьте токен бота.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка сети при запуске polling' });
    } finally {
      setActionLoading(null);
    }
  };

  const stopPolling = async () => {
    setActionLoading('stop');
    setMessage(null);
    try {
      const response = await fetch('/api/telegram/stop', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Polling остановлен.' });
        await loadTelegramStatus();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при остановке polling' });
    } finally {
      setActionLoading(null);
    }
  };

  const testConnection = async () => {
    setActionLoading('test');
    setMessage(null);
    try {
      const response = await fetch('/api/telegram/test');
      const data = await response.json();
      if (data.ok) {
        setMessage({ type: 'success', text: `Бот подключён: @${data.botName}` });
      } else {
        setMessage({ type: 'error', text: `Ошибка: ${data.error}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка сети при проверке' });
    } finally {
      setActionLoading(null);
    }
  };

  const statCards = [
    {
      label: 'Всего новостей',
      value: stats.newsCount,
      icon: FileText,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      trend: '+2 на этой неделе'
    },
    {
      label: 'Локаций',
      value: stats.locationsCount,
      icon: MapPin,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      trend: 'Работают штатно'
    },
    {
      label: 'Категорий меню',
      value: stats.categoriesCount,
      icon: Utensils,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      trend: 'Обновлено недавно'
    },
  ];

  return (
    <div className="text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold mb-2">Обзор</h1>
        <p className="text-white/50">Статистика и управление контентом</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-zinc-900 border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors group">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="text-xs font-medium text-white/30 bg-white/5 px-2 py-1 rounded-full">
                {stat.trend}
              </span>
            </div>
            <h3 className="text-white/50 text-sm font-medium mb-1">{stat.label}</h3>
            <p className="text-3xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Telegram Bot Management Section */}
      <div className="bg-zinc-900 border border-white/5 p-6 rounded-2xl mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Telegram Bot</h2>
            <p className="text-white/50 text-sm">Управление уведомлениями о бронированиях</p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${telegramStatus?.configured ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-white/50 text-sm">Токен</span>
            </div>
            <p className="font-medium">
              {telegramStatus?.configured ? 'Настроен' : 'Не настроен'}
            </p>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${telegramStatus?.polling ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
              <span className="text-white/50 text-sm">Polling</span>
            </div>
            <p className="font-medium">
              {telegramStatus?.polling ? 'Активен' : 'Остановлен'}
            </p>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-white/50" />
              <span className="text-white/50 text-sm">Подписчики</span>
            </div>
            <p className="font-medium">
              {telegramStatus?.subscribersCount || 0}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-4">
          {telegramStatus?.polling ? (
            <button
              onClick={stopPolling}
              disabled={actionLoading === 'stop'}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              {actionLoading === 'stop' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Square size={18} />
              )}
              Остановить
            </button>
          ) : (
            <button
              onClick={startPolling}
              disabled={actionLoading === 'start' || !telegramStatus?.configured}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              {actionLoading === 'start' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Play size={18} />
              )}
              Запустить
            </button>
          )}

          <button
            onClick={testConnection}
            disabled={actionLoading === 'test' || !telegramStatus?.configured}
            className="px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-700/50 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            {actionLoading === 'test' ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            Проверить
          </button>

          <button
            onClick={loadTelegramStatus}
            className="px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-xl transition-colors"
          >
            Обновить
          </button>
        </div>

        {/* Status Messages */}
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-xl ${
            message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Subscribers List */}
        {subscribers.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-white/50 mb-3">Подписчики ({subscribers.length})</h3>
            <div className="space-y-2">
              {subscribers.map((sub) => (
                <div key={sub.chatId} className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-medium">
                      {sub.firstName?.[0] || sub.username?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {sub.firstName || sub.username || `Chat ${sub.chatId}`}
                      </p>
                      {sub.username && (
                        <p className="text-xs text-white/40">@{sub.username}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-white/30">
                    {new Date(sub.subscribedAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        {!telegramStatus?.configured && (
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-amber-400 text-sm">
              <strong>Бот не настроен.</strong> Перейдите в{' '}
              <a href="/admin/booking-settings" className="underline hover:no-underline">
                Настройки бронирования
              </a>{' '}
              и добавьте токен Telegram бота.
            </p>
          </div>
        )}

        {telegramStatus?.configured && subscribers.length === 0 && (
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-blue-400 text-sm">
              <strong>Нет подписчиков.</strong> Откройте бота в Telegram и отправьте команду <code className="bg-blue-500/20 px-1 rounded">/start</code> чтобы подписаться на уведомления.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
