'use client';
import { DropdownMenu, Flex, Heading, Link } from '@radix-ui/themes';
import { useAuth } from '@/app/auth-provider';
import { AvatarIcon, ExitIcon, GearIcon, RocketIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { PRODUCT_NAME, XNGIN_API_DOCS_LINK } from '@/services/constants';

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
        <Heading>{PRODUCT_NAME}</Heading>
      </Link>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <AvatarIcon width="24" height="24" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item onClick={() => router.push('/organizations')}>
            <GearIcon /> Organizations
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item onClick={() => window.open(XNGIN_API_DOCS_LINK, '_blank', 'noopener')}>
            <RocketIcon />
            API Documentation
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
}
