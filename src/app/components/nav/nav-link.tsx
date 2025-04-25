'use client';

import Link from 'next/link';
import { Flex, Text, Tooltip } from '@radix-ui/themes';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { AnimatePresence } from 'motion/react';
import { AccessibleIcon } from '@radix-ui/react-accessible-icon';
import { MotionBox } from '@/app/lib/utils/motion/motion-utils';
import { transitions } from '@/app/lib/utils/motion/motion-tokens'; // 🧱 now pulling from tokens!

export interface NavLinkProps {
  href: string;
  isActive: boolean;
  label: string;
  icon: React.ComponentType<{ width?: string | number; height?: string | number; style?: React.CSSProperties }>;
  isOpen: boolean;
}

export const NavLink = ({ href, isActive, label, icon: Icon, isOpen }: NavLinkProps) => {
  return (
    <NavigationMenu.Link active={isActive} asChild>
      <Link href={href} passHref aria-label={label} style={{ textDecoration: 'none' }}>
        <MotionBox
          initial={false}
          animate={{
            backgroundColor: isActive ? 'var(--accent-a3)' : 'transparent',
            color: isActive ? 'var(--accent-a11)' : 'var(--gray-11)',
          }}
          transition={transitions.fast} // 🔥 using token
          layout
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            borderRadius: 'var(--radius-2)',
            padding: 'var(--space-2)',
          }}
        >
          <Flex align="center" gap="2">
            <AccessibleIcon label={label}>
              <Tooltip content={label} side="right" style={{ display: isOpen ? 'none' : 'block' }}>
                <Icon width={24} height={24} style={{ marginLeft: '2px' }} />
              </Tooltip>
            </AccessibleIcon>

            <AnimatePresence initial={false}>
              {isOpen && (
                <MotionBox
                  key="label"
                  initial={{ opacity: 0, maxWidth: 0 }}
                  animate={{ opacity: 1, maxWidth: 200 }}
                  exit={{ opacity: 0, maxWidth: 0 }}
                  transition={transitions.normal} // 🔥 using token
                  style={{
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Text size="3" weight="medium" truncate>
                    {label}
                  </Text>
                </MotionBox>
              )}
            </AnimatePresence>
          </Flex>
        </MotionBox>
      </Link>
    </NavigationMenu.Link>
  );
};
