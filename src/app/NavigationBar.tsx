'use client';
import { Box, Flex, Heading, Separator, IconButton } from '@radix-ui/themes';
import { GearIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { useAuth } from '@/app/auth-provider';
import { usePathname } from 'next/navigation';
import { OrganizationSelector } from '@/app/OrganizationSelector';

export const NavigationBar = () => {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  if (!isAuthenticated) return null;

  return (
    <Flex
      direction="column"
      gap="3"
      width="200px"
      height="100vh"
      p="4"
      style={{ borderRight: '1px solid var(--gray-5)' }}
    >
      <OrganizationSelector />
      <Separator size="4" />
      <Heading size="4">Experiments</Heading>
      <Flex direction="column" gap="2">
        <Link href="/">
          <Box
            p="2"
            style={{
              borderRadius: 'var(--radius-2)',
              backgroundColor: isActive('/') ? 'var(--gray-3)' : 'transparent',
            }}
          >
            Dashboard
          </Box>
        </Link>
        <Link href="/organizations">
          <Box
            p="2"
            style={{
              borderRadius: 'var(--radius-2)',
              backgroundColor: isActive('/organizations') ? 'var(--gray-3)' : 'transparent',
            }}
          >
            Organizations
          </Box>
        </Link>
      </Flex>
    </Flex>
  );
};
