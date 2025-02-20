'use client';
import { Box, Flex, Heading, Separator } from '@radix-ui/themes';
import Link from 'next/link';
import { useAuth } from '@/app/auth-provider';
import { usePathname } from 'next/navigation';
import { OrganizationSelector } from '@/app/organization-selector';
import { useCurrentOrganization } from '@/app/organization-provider';

export const NavigationBar = () => {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const org = useCurrentOrganization();

  const isActive = (path: string) => pathname.match(path);

  if (!isAuthenticated || org === null) return null;

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
              backgroundColor: isActive('/$') ? 'var(--gray-3)' : 'transparent',
            }}
          >
            Dashboard
          </Box>
        </Link>
        <Link href={`/organizationdetails?id=${org.current.id}`}>
          <Box
            p="2"
            style={{
              borderRadius: 'var(--radius-2)',
              backgroundColor: isActive(`/organizationdetails`) ? 'var(--gray-3)' : 'transparent',
            }}
          >
            Settings
          </Box>
        </Link>
        <Link href={`/experiments`}>
          <Box
            p="2"
            style={{
              borderRadius: 'var(--radius-2)',
              backgroundColor: isActive(`/experiments`) ? 'var(--gray-3)' : 'transparent',
            }}
          >
            Experiments
          </Box>
        </Link>
      </Flex>
    </Flex>
  );
};
