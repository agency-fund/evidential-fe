'use client';

import * as React from 'react';
import { motion, MotionProps } from 'motion/react';
import { Box, Flex, Grid, Container } from '@radix-ui/themes';

/**
 * motion-utils.tsx
 *
 * Radix-compatible motion wrappers for layout primitives and native HTML elements.
 *
 * Purpose:
 * - Ensures safe ref forwarding for use with Radix Primitives (asChild pattern)
 * - Provides Motion-enhanced versions of Box, Flex, Grid, Container, Section
 * - Encourages consistent animation setup across the app
 */

/* ------------------------------------
 * Radix Layout Components (safe for motion(Component))
 * ------------------------------------ */
export const MotionBox = motion(Box);
export const MotionFlex = motion(Flex);
export const MotionGrid = motion(Grid);
export const MotionContainer = motion(Container);

/* ------------------------------------
 * Native Semantic HTML Wrappers
 * ------------------------------------ */
export const MotionDiv = React.forwardRef<HTMLDivElement, MotionProps & React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <motion.div ref={ref} {...props} />,
);
MotionDiv.displayName = 'MotionDiv';

export const MotionNav = React.forwardRef<HTMLElement, MotionProps & React.HTMLAttributes<HTMLElement>>(
  (props, ref) => <motion.nav ref={ref} {...props} />,
);
MotionNav.displayName = 'MotionNav';

export const MotionSection = React.forwardRef<HTMLElement, MotionProps & React.HTMLAttributes<HTMLElement>>(
  (props, ref) => <motion.section ref={ref} {...props} />,
);
MotionSection.displayName = 'MotionSection';

/* ------------------------------------
 * General Helper
 * ------------------------------------ */
/**
 * withMotion() - Motion-izes any arbitrary React ElementType
 * Useful for custom components that you build later.
 */
export function withMotion<T extends React.ElementType>(Component: T) {
  return motion(Component);
}
