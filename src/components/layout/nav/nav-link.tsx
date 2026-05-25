'use client';

import Link from 'next/link';
import { Box, Flex, Text, Tooltip } from '@radix-ui/themes';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { AccessibleIcon } from '@radix-ui/react-accessible-icon';
import { transitions } from '@/services/transitions';

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
      <Link href={href} passHref style={{ textDecoration: 'none' }}>
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            borderRadius: 'var(--radius-2)',
            padding: 'var(--space-2)',
            backgroundColor: isActive ? 'var(--accent-a3)' : 'transparent',
            color: isActive ? 'var(--accent-a11)' : 'var(--gray-11)',
            transition: `background-color ${transitions.fast}, color ${transitions.fast}`,
          }}
        >
          <Flex align="center" gap="2">
            <AccessibleIcon label={label}>
              <Tooltip content={label} side="right" style={{ display: isOpen ? 'none' : 'block' }}>
                <Icon width={24} height={24} style={{ marginLeft: '2px' }} />
              </Tooltip>
            </AccessibleIcon>

            <Box
              aria-hidden={!isOpen}
              style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                maxWidth: isOpen ? '200px' : '0px',
                opacity: isOpen ? 1 : 0,
                transition: `max-width ${transitions.normal}, opacity ${transitions.normal}`,
              }}
            >
              <Text size="3" weight="medium" truncate>
                {label}
              </Text>
            </Box>
          </Flex>
        </Box>
      </Link>
    </NavigationMenu.Link>
  );
};
