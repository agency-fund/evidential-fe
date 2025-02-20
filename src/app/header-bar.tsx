'use client';
import { DropdownMenu, Flex, Heading } from '@radix-ui/themes';
import Link from 'next/link';
import { useAuth } from '@/app/auth-provider';
import { ExitIcon, GearIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';

export function HeaderBar() {
  const auth = useAuth();
  const router = useRouter();

  if (!auth.isAuthenticated) return null;

  return (
    <Flex
      justify="between"
      align="center"
      style={{
        borderBottom: '1px solid var(--gray-5)',
        padding: '16px',
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--color-page-background)',
        zIndex: 10,
      }}
    >
      <Link href="/">
        <Heading>xngin admin</Heading>
      </Link>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <GearIcon width="24" height="24" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item onClick={() => router.push('/organizations')}>
            Manage Organizations
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item color="red" onClick={auth.logout}>
            <ExitIcon />
            Logout
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </Flex>
  );
};
