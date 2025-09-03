'use client';

import { Box, Flex, Tooltip } from '@radix-ui/themes';
import { useAuth } from '@/providers/auth-provider';
import { usePathname } from 'next/navigation';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { GearIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { NavLink } from '@/components/layout/nav/nav-link';

export const NavigationBarNoCompact = () => {
  // Manual overide of isOpen state as nav-link children control width of nav
  const isOpen = true;
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

  const mainNavItems = [{ label: 'Experiments', href: '/', icon: LightningBoltIcon }];

  const utilityNavItems = [{ label: 'Settings', href: `/organizations/${org.current.id}`, icon: GearIcon }];

  return (
    <NavigationMenu.Root>
      <Flex direction="column" width="100%" p="3" gap="4" height="100%" py="5">
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
    </NavigationMenu.Root>
  );
};
