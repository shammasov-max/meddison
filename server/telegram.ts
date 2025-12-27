/**
 * Telegram Bot Service for Medisson Lounge
 *
 * Sends booking notifications to configured group chat ONLY.
 * No subscriber functionality - orders go exclusively to staff group.
 */

const TELEGRAM_API = 'https://api.telegram.org/bot';

// ==================== TYPES ====================

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
let groupChatId: string | null = null;
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

// ==================== RETRY LOGIC ====================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateBackoff(attempt: number, config: RetryConfig): number {
  const delay = Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay);
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.round(delay + jitter);
}

function isRetryableError(errorCode?: number, description?: string): boolean {
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
      const timeoutId = setTimeout(() => controller.abort(), 60000);

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

      if (!isRetryableError(result.error_code, result.description)) {
        console.error(`[telegram] Non-retryable error (${method}):`, result.description);
        return result;
      }

      if (attempt < retryConfig.maxRetries) {
        const delay = calculateBackoff(attempt, retryConfig);
        console.warn(`[telegram] Retry ${attempt + 1}/${retryConfig.maxRetries} for ${method} in ${delay}ms`);
        await sleep(delay);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      lastError = { ok: false, description: errorMessage };

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

  const tokenPattern = /^\d+:[A-Za-z0-9_-]+$/;
  if (!tokenPattern.test(token.trim())) {
    return { valid: false, error: 'Invalid token format' };
  }

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

function getMoscowDateTime(): string {
  const now = new Date();
  return now.toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function buildBookingMessage(booking: BookingForTelegram): string {
  const moscowTime = getMoscowDateTime();
  return `<b>🔔 Новая бронь!</b>

<b>Заведение:</b> ${escapeHtml(booking.location)}
<b>Дата:</b> ${booking.date}
<b>Время:</b> ${booking.time}
<b>Гостей:</b> ${booking.guests}
<b>Имя:</b> ${escapeHtml(booking.name)}
<b>Телефон:</b> ${booking.phone}

<i>ID: #${booking.id}</i>
<i>Получено: ${moscowTime} (МСК)</i>`;
}

// ==================== SENDING NOTIFICATIONS ====================

export async function sendBookingNotification(
  booking: BookingForTelegram
): Promise<Record<string, number>> {
  const messageIds: Record<string, number> = {};

  console.log(`[telegram] 📤 Processing notification for booking #${booking.id}: ${booking.name}, ${booking.date} ${booking.time}`);

  if (!botToken) {
    console.error('[telegram] ❌ Cannot send notification: bot not configured');
    return messageIds;
  }

  if (!groupChatId) {
    console.error('[telegram] ❌ Cannot send notification: group chat ID not configured');
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

  try {
    console.log(`[telegram] 📤 Sending booking #${booking.id} to group: ${groupChatId}`);
    const result = await telegramRequest<SentMessage>('sendMessage', {
      chat_id: groupChatId,
      text,
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });

    if (result.ok && result.result?.message_id) {
      messageIds[groupChatId] = result.result.message_id;
      console.log(`[telegram] ✅ Group notification sent to ${groupChatId}, msg_id: ${result.result.message_id}`);
    } else {
      console.error(`[telegram] ❌ Group send failed: ${result.description || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`[telegram] ❌ Exception sending booking #${booking.id}:`, error);
  }

  return messageIds;
}

// ==================== CALLBACK HANDLING ====================

function parseReceivedTimestamp(messageText: string): Date | null {
  // Parse "Получено: 26.12.2024, 22:00:34 (МСК)" from message
  const match = messageText.match(/Получено:\s*(\d{2})\.(\d{2})\.(\d{4}),?\s*(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;

  const [, day, month, year, hour, minute, second] = match;
  // Create date in Moscow timezone (UTC+3)
  const dateStr = `${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`;
  return new Date(dateStr);
}

function formatElapsedTime(startDate: Date, endDate: Date): string {
  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs < 0) return '0мин';

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}мин`;
  }
  if (minutes === 0) {
    return `${hours}ч`;
  }
  return `${hours}ч ${minutes}мин`;
}

async function handleCallbackQuery(query: TelegramUpdate['callback_query']): Promise<void> {
  if (!query?.data || !query.message) return;

  const [action, idStr] = query.data.split(':');

  if (action === 'booking_handled') {
    const bookingId = parseInt(idStr, 10);
    const handledBy = query.from.first_name || query.from.username || 'Admin';

    console.log(`[telegram] Callback: booking ${bookingId} handled by ${handledBy}`);

    // Answer callback query
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

    // Calculate timing info
    const originalText = query.message.text || '';
    const callbackTime = getMoscowDateTime();
    const receivedTime = parseReceivedTimestamp(originalText);

    let elapsedStr = '';
    if (receivedTime) {
      const now = new Date();
      elapsedStr = formatElapsedTime(receivedTime, now);
    }

    // Update the message to show confirmed status with timing
    const statusLines = [
      `<b>✅ Перезвонили:</b> ${callbackTime}`,
    ];
    if (elapsedStr) {
      statusLines.push(`<b>⏱ Обработали за:</b> ${elapsedStr}`);
    }

    const newText = `${originalText}\n\n${statusLines.join('\n')}`;

    await telegramRequest('editMessageText', {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      text: newText,
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
      allowed_updates: ['callback_query'], // Only listen for callback queries (button clicks)
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
          }
          // Ignore all other messages - bot only responds to button clicks in group
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
    groupChatId = chatId;
  }
  console.log(`[telegram] Bot configured: token=${token ? 'set' : 'none'}, groupChatId=${groupChatId || 'none'}`);
}

export function setChatId(chatId: string | null): void {
  groupChatId = chatId;
  console.log(`[telegram] Group chat ID updated: ${chatId || 'none'}`);
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
    chatId: groupChatId,
  };
}

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

  if (pollingActive) {
    stopPolling();
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (!token || token.trim() === '') {
    botToken = null;
    groupChatId = chatId;
    console.log('[telegram] Bot stopped (no token)');
    return { success: true };
  }

  const validation = await validateToken(token.trim());
  if (!validation.valid) {
    console.error(`[telegram] Invalid token: ${validation.error}`);
    return { success: false, error: validation.error };
  }

  botToken = token.trim();
  groupChatId = chatId;

  const started = await startPolling();
  if (!started) {
    return { success: false, error: 'Failed to start polling' };
  }

  console.log(`[telegram] Reconfigured: @${validation.botName}, groupChatId=${chatId || 'none'}`);
  return { success: true, botName: validation.botName };
}

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
