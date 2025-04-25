'use client';

/**
 * motion-variants.ts
 *
 * Reusable motion "recipes" for common entrance/exit animations.
 *
 * Purpose:
 * - Provides consistent, declarative variants for Motion components
 * - Makes animate/initial/exit behaviors easy to standardize
 * - Encourages semantic naming of animation types (fadeIn, scaleIn, slideIn)
 */

/* ------------------------------------
 * Motion Variants
 * ------------------------------------ */
export const variants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  fadeAndGrow: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
  slideInLeft: {
    hidden: { x: -50, opacity: 0 },
    visible: { x: 0, opacity: 1 },
  },
  slideInRight: {
    hidden: { x: 50, opacity: 0 },
    visible: { x: 0, opacity: 1 },
  },
  scaleIn: {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
  },
};
