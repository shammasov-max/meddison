import { lazy, ComponentType } from 'react';

/**
 * A wrapper around React.lazy that reloads the page once if the import fails.
 * This handles the common "Failed to fetch dynamically imported module" error
 * that occurs when a new version is deployed and the user is on an old version.
 */
export const lazyRetry = <T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  name: string
) => {
  return lazy(async () => {
    const storageKey = `retry-${name}-refreshed`;
    const hasRefreshed = JSON.parse(
      window.sessionStorage.getItem(storageKey) || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem(storageKey, 'false');
      return component;
    } catch (error) {
      if (!hasRefreshed) {
        // Assuming that the user is not on the latest version of the application.
        // Let's refresh the page immediately.
        window.sessionStorage.setItem(storageKey, 'true');
        window.location.reload();
        // Return a never-resolving promise to wait for reload
        return new Promise(() => {});
      }

      // The page has already been refreshed, this is a real error.
      throw error;
    }
  });
};
