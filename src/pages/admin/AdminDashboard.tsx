import React, { useEffect, useState } from 'react';
import { dataService } from '../../services/dataService';
import { FileText, MapPin, Utensils, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    newsCount: 0,
    locationsCount: 0,
    categoriesCount: 0,
  });
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [webhookMessage, setWebhookMessage] = useState('');

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
  }, []);

  const setupTelegramWebhook = async () => {
    setWebhookStatus('loading');
    setWebhookMessage('');
    try {
      const response = await fetch('/api/telegram/setup');
      const data = await response.json();
      if (data.telegram_response?.ok) {
        setWebhookStatus('success');
        setWebhookMessage('Webhook успешно настроен! Кнопки в Telegram теперь работают.');
      } else {
        setWebhookStatus('error');
        setWebhookMessage(`Ошибка: ${data.telegram_response?.description || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      setWebhookStatus('error');
      setWebhookMessage(`Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      console.error('Webhook setup error:', error);
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

      {/* Telegram Webhook Setup Section */}
      <div className="bg-zinc-900 border border-white/5 p-6 rounded-2xl mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Send size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Настройка Telegram</h2>
            <p className="text-white/50 text-sm">Настройка webhook для кнопок в уведомлениях</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <button
            onClick={setupTelegramWebhook}
            disabled={webhookStatus === 'loading'}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            {webhookStatus === 'loading' ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Настройка...
              </>
            ) : (
              <>
                <Send size={20} />
                Настроить Webhook
              </>
            )}
          </button>
          
          {webhookStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle size={20} />
              <span>{webhookMessage}</span>
            </div>
          )}
          
          {webhookStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle size={20} />
              <span>{webhookMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
