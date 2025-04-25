'use client';

import * as React from 'react';
import { motion, MotionProps } from 'motion/react';
import { Box, Flex } from '@radix-ui/themes';

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

/* ------------------------------------
 * Native Semantic HTML Wrappers
 * ------------------------------------ */

export const MotionNav = React.forwardRef<HTMLElement, MotionProps & React.HTMLAttributes<HTMLElement>>(
  (props, ref) => <motion.nav ref={ref} {...props} />,
);
MotionNav.displayName = 'MotionNav';
