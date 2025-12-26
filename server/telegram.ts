/**
 * Telegram Bot Service for Medisson Lounge
 *
 * Handles:
 * - Sending booking notifications to configured chat/community
 * - Fallback to subscribed admins if no chat_id configured
 * - Dynamic bot reconfiguration without server restart
 * - Robust error handling with retry logic
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, 'data');
const SUBSCRIBERS_FILE = join(DATA_PATH, 'telegram_subscribers.json');
const TELEGRAM_API = 'https://api.telegram.org/bot';

// ==================== TYPES ====================

export interface TelegramSubscriber {
  chatId: number;
  username?: string;
  firstName?: string;
  subscribedAt: string;
}

export interface BookingForTelegram {
  id: number;
  location: string;
  date: string;
  time: string;
  guests: number;
  name: string;
  phone: string;
}

interface TelegramResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
    };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
      };
      text?: string;
    };
    data?: string;
  };
}

interface SentMessage {
  message_id: number;
  chat: {
    id: number;
  };
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

// ==================== STATE ====================

let botToken: string | null = null;
let communityChatId: string | null = null;
let pollingActive = false;
let pollingTimeout: ReturnType<typeof setTimeout> | null = null;
let lastUpdateId = 0;

// Callback for handling booking status updates
let onBookingHandled: ((bookingId: number, handledBy: string) => Promise<void>) | null = null;

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

// ==================== FILE HELPERS ====================

async function readSubscribers(): Promise<TelegramSubscriber[]> {
  try {
    const data = await readFile(SUBSCRIBERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeSubscribers(subscribers: TelegramSubscriber[]): Promise<void> {
  await writeFile(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf8');
}

// ==================== RETRY LOGIC ====================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateBackoff(attempt: number, config: RetryConfig): number {
  const delay = Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay);
  // Add jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.round(delay + jitter);
}

function isRetryableError(errorCode?: number, description?: string): boolean {
  // Retry on rate limits (429), server errors (5xx), network issues
  if (errorCode === 429) return true;
  if (errorCode && errorCode >= 500 && errorCode < 600) return true;
  if (description?.includes('timeout') || description?.includes('network')) return true;
  return false;
}

// ==================== TELEGRAM API ====================

async function telegramRequest<T>(
  method: string,
  body?: object,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<TelegramResponse<T>> {
  if (!botToken) {
    console.error('[telegram] Bot token not configured');
    return { ok: false, description: 'Bot token not configured' };
  }

  let lastError: TelegramResponse<T> = { ok: false, description: 'Unknown error' };

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const response = await fetch(`${TELEGRAM_API}${botToken}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json() as TelegramResponse<T>;

      if (result.ok) {
        return result;
      }

      lastError = result;

      // Check if error is retryable
      if (!isRetryableError(result.error_code, result.description)) {
        console.error(`[telegram] Non-retryable error (${method}):`, result.description);
        return result;
      }

      // Don't retry on last attempt
      if (attempt < retryConfig.maxRetries) {
        const delay = calculateBackoff(attempt, retryConfig);
        console.warn(`[telegram] Retry ${attempt + 1}/${retryConfig.maxRetries} for ${method} in ${delay}ms`);
        await sleep(delay);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      lastError = { ok: false, description: errorMessage };

      // Retry on network errors
      if (attempt < retryConfig.maxRetries) {
        const delay = calculateBackoff(attempt, retryConfig);
        console.warn(`[telegram] Network error, retry ${attempt + 1}/${retryConfig.maxRetries} in ${delay}ms:`, errorMessage);
        await sleep(delay);
      } else {
        console.error(`[telegram] API error after ${retryConfig.maxRetries + 1} attempts (${method}):`, errorMessage);
      }
    }
  }

  return lastError;
}

// ==================== TOKEN VALIDATION ====================

export async function validateToken(token: string): Promise<{ valid: boolean; botName?: string; error?: string }> {
  if (!token || token.trim() === '') {
    return { valid: false, error: 'Token is empty' };
  }

  // Basic format validation: number:alphanumeric
  const tokenPattern = /^\d+:[A-Za-z0-9_-]+$/;
  if (!tokenPattern.test(token.trim())) {
    return { valid: false, error: 'Invalid token format' };
  }

  // Save current token, test with new one
  const previousToken = botToken;
  botToken = token.trim();

  try {
    const result = await telegramRequest<{ username: string; first_name: string }>('getMe', undefined, {
      maxRetries: 1,
      baseDelay: 500,
      maxDelay: 2000,
    });

    if (result.ok && result.result) {
      return { valid: true, botName: result.result.username };
    }

    return { valid: false, error: result.description || 'Token validation failed' };
  } finally {
    // Restore previous token
    botToken = previousToken;
  }
}

// ==================== MESSAGE BUILDING ====================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildBookingMessage(booking: BookingForTelegram): string {
  return `<b>🔔 Новая бронь!</b>

<b>Заведение:</b> ${escapeHtml(booking.location)}
<b>Дата:</b> ${booking.date}
<b>Время:</b> ${booking.time}
<b>Гостей:</b> ${booking.guests}
<b>Имя:</b> ${escapeHtml(booking.name)}
<b>Телефон:</b> ${booking.phone}

<i>ID: #${booking.id}</i>`;
}

// ==================== SUBSCRIBER MANAGEMENT ====================

export async function addSubscriber(
  chatId: number,
  username?: string,
  firstName?: string
): Promise<boolean> {
  try {
    const subscribers = await readSubscribers();

    if (subscribers.some(s => s.chatId === chatId)) {
      console.log(`[telegram] Subscriber ${chatId} already exists`);
      return false;
    }

    subscribers.push({
      chatId,
      username,
      firstName,
      subscribedAt: new Date().toISOString(),
    });

    await writeSubscribers(subscribers);
    console.log(`[telegram] New subscriber added: ${chatId} (${firstName || username || 'unknown'})`);
    return true;
  } catch (error) {
    console.error('[telegram] Failed to add subscriber:', error);
    return false;
  }
}

export async function removeSubscriber(chatId: number): Promise<boolean> {
  try {
    const subscribers = await readSubscribers();
    const index = subscribers.findIndex(s => s.chatId === chatId);

    if (index === -1) {
      return false;
    }

    subscribers.splice(index, 1);
    await writeSubscribers(subscribers);
    console.log(`[telegram] Subscriber removed: ${chatId}`);
    return true;
  } catch (error) {
    console.error('[telegram] Failed to remove subscriber:', error);
    return false;
  }
}

export async function getSubscribers(): Promise<TelegramSubscriber[]> {
  return readSubscribers();
}

// ==================== SENDING NOTIFICATIONS ====================

export async function sendBookingNotification(
  booking: BookingForTelegram
): Promise<Record<string, number>> {
  const messageIds: Record<string, number> = {};

  if (!botToken) {
    console.log('[telegram] Cannot send notification: bot not configured');
    return messageIds;
  }

  const text = buildBookingMessage(booking);
  const keyboard = {
    inline_keyboard: [[
      {
        text: '✅ Перезвонено',
        callback_data: `booking_handled:${booking.id}`,
      },
    ]],
  };

  // 1. Send to community chat if configured
  if (communityChatId) {
    console.log(`[telegram] Sending to community chat: ${communityChatId}`);
    const result = await telegramRequest<SentMessage>('sendMessage', {
      chat_id: communityChatId,
      text,
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });

    if (result.ok && result.result?.message_id) {
      messageIds[communityChatId] = result.result.message_id;
      console.log(`[telegram] Notification sent to community ${communityChatId}, message_id: ${result.result.message_id}`);
    } else {
      console.error(`[telegram] Failed to send to community ${communityChatId}: ${result.description}`);
      // Continue to subscribers as fallback
    }
  }

  // 2. Send to individual subscribers (fallback or additional)
  const subscribers = await readSubscribers();

  if (subscribers.length === 0 && !communityChatId) {
    console.log('[telegram] No community chat configured and no subscribers');
    return messageIds;
  }

  // Only send to subscribers if no community chat is set
  // (community is the primary destination)
  if (!communityChatId) {
    for (const subscriber of subscribers) {
      const result = await telegramRequest<SentMessage>('sendMessage', {
        chat_id: subscriber.chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });

      if (result.ok && result.result?.message_id) {
        messageIds[String(subscriber.chatId)] = result.result.message_id;
        console.log(`[telegram] Notification sent to subscriber ${subscriber.chatId}`);
      } else {
        console.error(`[telegram] Failed to send to subscriber ${subscriber.chatId}: ${result.description}`);
      }
    }
  }

  return messageIds;
}

// ==================== CALLBACK HANDLING ====================

async function handleCallbackQuery(query: TelegramUpdate['callback_query']): Promise<void> {
  if (!query?.data || !query.message) return;

  const [action, idStr] = query.data.split(':');

  if (action === 'booking_handled') {
    const bookingId = parseInt(idStr, 10);
    const handledBy = query.from.first_name || query.from.username || 'Admin';

    console.log(`[telegram] Callback: booking ${bookingId} handled by ${handledBy}`);

    // Answer callback query (remove loading state from button)
    await telegramRequest('answerCallbackQuery', {
      callback_query_id: query.id,
      text: '✅ Статус обновлён!',
    });

    // Call the handler if registered
    if (onBookingHandled) {
      try {
        await onBookingHandled(bookingId, handledBy);
      } catch (error) {
        console.error('[telegram] Error in booking handled callback:', error);
      }
    }

    // Update the message to show confirmed status
    const originalText = query.message.text || '';
    const newText = `${originalText}\n\n<b>✅ Статус: Перезвонено</b>\n<i>Обработал: ${escapeHtml(handledBy)}</i>`;

    await telegramRequest('editMessageText', {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      text: newText,
      parse_mode: 'HTML',
    });
  }
}

async function handleMessage(message: TelegramUpdate['message']): Promise<void> {
  if (!message?.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();
  const firstName = message.from.first_name;
  const username = message.from.username;

  if (text === '/start') {
    const added = await addSubscriber(chatId, username, firstName);
    const responseText = added
      ? `Привет, ${firstName}! 👋\n\nВы подписаны на уведомления о бронированиях Medisson Lounge.\n\nВы будете получать сообщения о новых бронях с кнопкой "Перезвонено" для отметки статуса.`
      : `${firstName}, вы уже подписаны на уведомления! ✅`;

    await telegramRequest('sendMessage', {
      chat_id: chatId,
      text: responseText,
    });
  } else if (text === '/stop') {
    const removed = await removeSubscriber(chatId);
    const responseText = removed
      ? '❌ Вы отписались от уведомлений.\n\nИспользуйте /start чтобы подписаться снова.'
      : 'Вы не были подписаны на уведомления.';

    await telegramRequest('sendMessage', {
      chat_id: chatId,
      text: responseText,
    });
  } else if (text === '/status') {
    const subscribers = await readSubscribers();
    const isSubscribed = subscribers.some(s => s.chatId === chatId);
    const responseText = isSubscribed
      ? `✅ Вы подписаны на уведомления.\n📊 Всего подписчиков: ${subscribers.length}\n🏢 Чат сообщества: ${communityChatId || 'не настроен'}`
      : '❌ Вы не подписаны.\n\nИспользуйте /start для подписки.';

    await telegramRequest('sendMessage', {
      chat_id: chatId,
      text: responseText,
    });
  } else if (text === '/help') {
    await telegramRequest('sendMessage', {
      chat_id: chatId,
      text: `🤖 <b>Medisson Lounge Bot</b>

Доступные команды:
/start - Подписаться на уведомления
/stop - Отписаться от уведомлений
/status - Проверить статус подписки
/help - Показать эту справку`,
      parse_mode: 'HTML',
    });
  }
}

// ==================== LONG POLLING ====================

async function pollUpdates(): Promise<void> {
  if (!pollingActive || !botToken) return;

  try {
    const result = await telegramRequest<TelegramUpdate[]>('getUpdates', {
      offset: lastUpdateId + 1,
      timeout: 30,
      allowed_updates: ['message', 'callback_query'],
    }, {
      maxRetries: 2,
      baseDelay: 1000,
      maxDelay: 5000,
    });

    if (result.ok && result.result) {
      for (const update of result.result) {
        lastUpdateId = Math.max(lastUpdateId, update.update_id);

        try {
          if (update.callback_query) {
            await handleCallbackQuery(update.callback_query);
          } else if (update.message) {
            await handleMessage(update.message);
          }
        } catch (error) {
          console.error('[telegram] Error handling update:', error);
        }
      }
    }
  } catch (error) {
    console.error('[telegram] Polling error:', error);
  }

  // Schedule next poll
  if (pollingActive) {
    pollingTimeout = setTimeout(pollUpdates, 1000);
  }
}

// ==================== PUBLIC API ====================

export function configure(token: string | null, chatId?: string | null): void {
  botToken = token;
  if (chatId !== undefined) {
    communityChatId = chatId;
  }
  console.log(`[telegram] Bot configured: token=${token ? 'set' : 'none'}, chatId=${communityChatId || 'none'}`);
}

export function setChatId(chatId: string | null): void {
  communityChatId = chatId;
  console.log(`[telegram] Chat ID updated: ${chatId || 'none'}`);
}

export function setBookingHandledCallback(
  callback: (bookingId: number, handledBy: string) => Promise<void>
): void {
  onBookingHandled = callback;
}

export async function startPolling(): Promise<boolean> {
  if (!botToken) {
    console.error('[telegram] Cannot start polling: bot token not configured');
    return false;
  }

  // Validate token before starting
  const validation = await validateToken(botToken);
  if (!validation.valid) {
    console.error(`[telegram] Cannot start polling: ${validation.error}`);
    return false;
  }

  if (pollingActive) {
    console.log('[telegram] Polling already active');
    return true;
  }

  pollingActive = true;
  console.log(`[telegram] Starting long-polling... (bot: @${validation.botName})`);
  pollUpdates();
  return true;
}

export function stopPolling(): void {
  pollingActive = false;
  if (pollingTimeout) {
    clearTimeout(pollingTimeout);
    pollingTimeout = null;
  }
  console.log('[telegram] Polling stopped');
}

export function isPollingActive(): boolean {
  return pollingActive;
}

export function getStatus(): {
  configured: boolean;
  polling: boolean;
  token: string | null;
  chatId: string | null;
} {
  return {
    configured: !!botToken,
    polling: pollingActive,
    token: botToken ? `${botToken.slice(0, 10)}...` : null,
    chatId: communityChatId,
  };
}

// Test connection
export async function testConnection(): Promise<{ ok: boolean; botName?: string; error?: string }> {
  if (!botToken) {
    return { ok: false, error: 'Bot token not configured' };
  }

  const result = await telegramRequest<{ username: string }>('getMe');
  if (result.ok && result.result) {
    return { ok: true, botName: result.result.username };
  }
  return { ok: false, error: result.description };
}

// ==================== DYNAMIC RECONFIGURATION ====================

export async function reconfigure(
  token: string | null,
  chatId: string | null
): Promise<{ success: boolean; botName?: string; error?: string }> {
  console.log('[telegram] Reconfiguration requested...');

  // Stop current polling if active
  if (pollingActive) {
    stopPolling();
    // Wait for polling to stop
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // If no token provided, fully stop the bot
  if (!token || token.trim() === '') {
    botToken = null;
    communityChatId = chatId;
    console.log('[telegram] Bot stopped (no token)');
    return { success: true };
  }

  // Validate the new token
  const validation = await validateToken(token.trim());
  if (!validation.valid) {
    console.error(`[telegram] Invalid token: ${validation.error}`);
    return { success: false, error: validation.error };
  }

  // Configure with new settings
  botToken = token.trim();
  communityChatId = chatId;

  // Start polling with new configuration
  const started = await startPolling();
  if (!started) {
    return { success: false, error: 'Failed to start polling' };
  }

  console.log(`[telegram] Reconfigured: @${validation.botName}, chatId=${chatId || 'none'}`);
  return { success: true, botName: validation.botName };
}

// Send test message to verify chat_id works
export async function sendTestMessage(chatId: string): Promise<{ ok: boolean; error?: string }> {
  if (!botToken) {
    return { ok: false, error: 'Bot token not configured' };
  }

  const result = await telegramRequest<SentMessage>('sendMessage', {
    chat_id: chatId,
    text: '✅ Тестовое сообщение от Medisson Lounge Bot\n\nЕсли вы видите это сообщение, бот настроен правильно!',
    parse_mode: 'HTML',
  });

  if (result.ok) {
    return { ok: true };
  }
  return { ok: false, error: result.description };
}
