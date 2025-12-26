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
 * Get animation duration - instant in dev mode
 */
export const getAnimationDuration = (duration: number): number => {
  return isDev ? 0 : duration;
};

/**
 * Get animation delay - no delay in dev mode
 */
export const getAnimationDelay = (delay: number): number => {
  return isDev ? 0 : delay;
};

/**
 * Create motion props that skip initial animation in dev mode
 * Use this for page-load animations (initial -> animate)
 */
export const devMotionProps = (props: {
  initial?: object;
  animate?: object;
  transition?: object;
}) => {
  if (isDev) {
    // In dev mode, start at the final state with no animation
    return {
      initial: props.animate,
      animate: props.animate,
      transition: { duration: 0 },
    };
  }
  return props;
};

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
