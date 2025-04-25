'use client';

/**
 * motion-tokens.ts
 *
 * Centralized timing, easing, and transition definitions.
 *
 * Purpose:
 * - Standardizes durations, easings, and transitions across the app
 * - Mirrors Radix Themes' philosophy of tokenizing design decisions
 * - Enables simple, scalable animation declarations
 */

/* ------------------------------------
 * Easing Functions (cubic bezier)
 * ------------------------------------ */
export const easings = {
  standard: [0.4, 0, 0.2, 1], // Default "ease-in-out" feel
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
};

/* ------------------------------------
 * Duration Tokens (seconds)
 * ------------------------------------ */
export const durations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
};

/* ------------------------------------
 * Transition Shorthands
 * ------------------------------------ */
export const transitions = {
  fast: { duration: durations.fast, ease: easings.standard },
  normal: { duration: durations.normal, ease: easings.standard },
  slow: { duration: durations.slow, ease: easings.standard },
};
