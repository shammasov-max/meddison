import { useState, useEffect, useCallback } from 'react';
import { dataService } from '../services/dataService';
import type { SiteContent, Location, NewsItem } from '../types';

/**
 * Unified data hook for Medisson Lounge website.
 *
 * Provides:
 * - Automatic data loading on mount
 * - Reactive updates via 'data-updated' event
 * - Convenience selectors for common data sections
 * - Type-safe access to all site content
 */
export const useData = () => {
  const [data, setData] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const loadedData = await dataService.load();
        setData(loadedData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load data'));
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Listen for updates (from admin panel saves, etc.)
    const handleUpdate = () => {
      const updatedData = dataService.getData();
      if (updatedData) {
        setData(updatedData);
      }
    };

    window.addEventListener('data-updated', handleUpdate);
    return () => window.removeEventListener('data-updated', handleUpdate);
  }, []);

  // Save data and trigger update
  const save = useCallback(async (newData: SiteContent): Promise<boolean> => {
    const success = await dataService.save(newData);
    if (success) {
      setData(newData);
    }
    return success;
  }, []);

  // Helper to update a specific location
  const updateLocation = useCallback(async (location: Location): Promise<boolean> => {
    if (!data) return false;

    const locations = data.locations.map((l) =>
      l.id === location.id ? location : l
    );
    // Add new location if not found
    if (!locations.find((l) => l.id === location.id)) {
      locations.push(location);
    }

    return save({ ...data, locations });
  }, [data, save]);

  // Helper to delete a location
  const deleteLocation = useCallback(async (id: number): Promise<boolean> => {
    if (!data) return false;

    const locations = data.locations.filter((l) => l.id !== id);
    return save({ ...data, locations });
  }, [data, save]);

  // Helper to update a specific news item
  const updateNewsItem = useCallback(async (newsItem: NewsItem): Promise<boolean> => {
    if (!data) return false;

    const news = data.news.map((n) =>
      n.id === newsItem.id ? newsItem : n
    );
    // Add new item if not found
    if (!news.find((n) => n.id === newsItem.id)) {
      news.push(newsItem);
    }

    return save({ ...data, news });
  }, [data, save]);

  // Helper to delete a news item
  const deleteNewsItem = useCallback(async (id: number): Promise<boolean> => {
    if (!data) return false;

    const news = data.news.filter((n) => n.id !== id);
    return save({ ...data, news });
  }, [data, save]);

  return {
    // State
    data,
    loading,
    error,

    // Convenience selectors
    hero: data?.hero,
    about: data?.about,
    advantages: data?.advantages,
    atmosphere: data?.atmosphere,
    menuCategories: data?.menuCategories ?? [],
    contact: data?.contact,
    seo: data?.seo,
    locations: data?.locations ?? [],
    news: data?.news ?? [],

    // Mutation helpers
    save,
    updateLocation,
    deleteLocation,
    updateNewsItem,
    deleteNewsItem,
  };
};
