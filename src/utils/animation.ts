/**
 * Animation utilities for development mode optimization
 *
 * In development mode, page-load animations are disabled to speed up development.
 * Scroll-based and interaction animations still work normally.
 */

/**
 * Check if we're in development mode
 */
export const isDev = import.meta.env.DEV;

/**
 * Framer Motion variants helper for dev mode
 * Scroll-based animations (whileInView) still work but are instant
 */
export const devTransition = (transition: object): object => {
  if (isDev) {
    return { duration: 0, delay: 0 };
  }
  return transition;
};

/**
 * Whether to show the preloader
 * Skip preloader entirely in dev mode
 */
export const showPreloader = !isDev;
