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
   * Load site content from API (with static file fallback).
   * Returns cached data if already loaded, unless forceRefresh is true.
   */
  load: async (forceRefresh = false): Promise<SiteContent> => {
    if (data && !forceRefresh) {
      return data;
    }

    try {
      // Try API first (if backend is running)
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }
      data = await response.json();
      console.log('[dataService] Data loaded from API');
      return data!;
    } catch (apiError) {
      // Fallback to static file for dev without backend
      console.warn('[dataService] API unavailable, falling back to static file');
      try {
        const response = await fetch('/data/data.json');
        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.status}`);
        }
        data = await response.json();
        console.log('[dataService] Data loaded from static file');
        return data!;
      } catch (error) {
        console.error('[dataService] Failed to load data:', error);
        throw error;
      }
    }
  },

  /**
   * Save site content to backend API.
   * Creates a backup before saving.
   */
  save: async (newData: SiteContent): Promise<boolean> => {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + btoa('admin:medisson2024'),
        },
        body: JSON.stringify(newData, null, 2),
      });

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }

      data = newData;
      console.log('[dataService] Data saved to backend');
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
