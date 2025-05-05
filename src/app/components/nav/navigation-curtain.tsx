'use client';

import { Box, Flex, IconButton, Tooltip, Separator } from '@radix-ui/themes';
import { useAuth } from '@/app/providers/auth-provider';
import { usePathname } from 'next/navigation';
import { useCurrentOrganization } from '@/app/providers/organization-provider';
import { HamburgerMenuIcon, HomeIcon, GearIcon, ChevronLeftIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { NavLink } from '@/app/components/nav/nav-link';
import { MotionNav, MotionBox } from '@/app/lib/utils/motion/motion-utils';
import { transitions } from '@/app/lib/utils/motion/motion-tokens';

export const NavigationBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const org = useCurrentOrganization();

  const isActive = (navHref: string) => {
    if (navHref === '/') return pathname === '/';
    const navHrefBase = navHref.split('?')[0];
    const pathnameBase = pathname.split('?')[0];
    return pathnameBase === navHrefBase || pathnameBase.startsWith(navHrefBase + '/');
  };

  if (!isAuthenticated || org === null) return null;

  const mainNavItems = [{ label: 'Dashboard', href: '/', icon: HomeIcon }];

  const utilityNavItems = [{ label: 'Settings', href: `/organizationdetails?id=${org.current.id}`, icon: GearIcon }];

  return (
    <NavigationMenu.Root asChild>
      <MotionNav
        animate={{ width: isOpen ? 200 : 60 }}
        transition={transitions.normal}
        initial={false}
        layout
        style={{
          display: 'flex',
          height: '100%',
          backgroundColor: 'var(--gray-1)',
          borderRight: '1px solid var(--gray-5)',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <Flex direction="column" width="100%" p="2" gap="4" height="100%" py="5">
          {/* Toggle Button to open and close nav curtain */}
          <Flex justify={isOpen ? 'end' : 'center'} width="100%">
            <MotionBox initial={false} layout transition={transitions.normal}>
              <Tooltip content={isOpen ? 'Collapse navigation' : 'Expand navigation'}>
                <IconButton onClick={() => setIsOpen((o) => !o)} size="2" variant="ghost" color="gray">
                  {isOpen ? <ChevronLeftIcon width={20} height={20} /> : <HamburgerMenuIcon width={20} height={20} />}
                </IconButton>
              </Tooltip>
            </MotionBox>
          </Flex>
          <Separator size="4" />
          {/* Top nav links defined in mainNavItems */}
          <NavigationMenu.List asChild id="nav-content">
            <Flex direction="column" gap="1" p="0" m="0" style={{ listStyle: 'none' }}>
              {mainNavItems.map((item) => (
                <NavigationMenu.Item key={item.href}>
                  <Tooltip content={item.label} side="right">
                    <NavLink
                      href={item.href}
                      isActive={isActive(item.href)}
                      label={item.label}
                      icon={item.icon}
                      isOpen={isOpen}
                    />
                  </Tooltip>
                </NavigationMenu.Item>
              ))}
            </Flex>
          </NavigationMenu.List>

          <Box flexGrow="1" />

          {/* Utility nav links defined in utilityNavItems mainly used for settings */}
          <NavigationMenu.List asChild>
            <Flex direction="column" gap="1" p="0" m="0" style={{ listStyle: 'none' }}>
              {utilityNavItems.map((item) => (
                <NavigationMenu.Item key={item.href}>
                  <Tooltip content={item.label} side="right">
                    <NavLink
                      href={item.href}
                      isActive={isActive(item.href)}
                      label={item.label}
                      icon={item.icon}
                      isOpen={isOpen}
                    />
                  </Tooltip>
                </NavigationMenu.Item>
              ))}
            </Flex>
          </NavigationMenu.List>
        </Flex>
      </MotionNav>
    </NavigationMenu.Root>
  );
};
