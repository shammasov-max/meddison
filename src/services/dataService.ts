import type { SiteContent, Location, NewsItem } from '../types';

/**
 * Data service for Medisson Lounge website.
 *
 * Architecture:
 * - 2 async methods: load(), save()
 * - 3 sync methods: getData(), getLocation(), getNewsItem()
 *
 * Data is loaded from /data/data.json and cached in memory.
 * Save operations update in-memory state only (mock).
 */

// In-memory data cache
let data: SiteContent | null = null;

export const dataService = {
  // ==================== ASYNC METHODS (only 2) ====================

  /**
   * Load site content from data.json.
   * Returns cached data if already loaded.
   */
  load: async (): Promise<SiteContent> => {
    if (data) {
      return data;
    }

    try {
      const response = await fetch('/data/data.json');
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status}`);
      }
      data = await response.json();
      return data!;
    } catch (error) {
      console.error('[dataService] Failed to load data:', error);
      throw error;
    }
  },

  /**
   * Save site content (mock - in-memory only).
   * In production, this would persist to a backend.
   */
  save: async (newData: SiteContent): Promise<boolean> => {
    try {
      data = newData;
      console.log('[dataService] Data saved to memory');
      // Dispatch event for reactive updates
      window.dispatchEvent(new Event('data-updated'));
      return true;
    } catch (error) {
      console.error('[dataService] Failed to save data:', error);
      return false;
    }
  },

  // ==================== SYNC METHODS (only 3) ====================

  /**
   * Get the current cached data.
   * Returns null if data hasn't been loaded yet.
   */
  getData: (): SiteContent | null => data,

  /**
   * Get a location by slug.
   * Returns undefined if not found or data not loaded.
   */
  getLocation: (slug: string): Location | undefined => {
    return data?.locations.find((l) => l.slug === slug);
  },

  /**
   * Get a news item by slug.
   * Returns undefined if not found or data not loaded.
   */
  getNewsItem: (slug: string): NewsItem | undefined => {
    return data?.news.find((n) => n.slug === slug);
  },

  // ==================== INTERNAL UTILITIES ====================

  /**
   * Clear the cache (useful for testing or forced refresh).
   */
  _clearCache: (): void => {
    data = null;
  },

  /**
   * Check if data is loaded.
   */
  _isLoaded: (): boolean => data !== null,
};
