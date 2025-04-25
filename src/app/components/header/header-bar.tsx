'use client';
import { Button, DropdownMenu, Flex, Heading, Text } from '@radix-ui/themes';
import { useAuth } from '@/app/providers/auth-provider';
import {
  AvatarIcon,
  ExclamationTriangleIcon,
  ExitIcon,
  GearIcon,
  RocketIcon,
  ArrowRightIcon,
} from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { PRODUCT_NAME, XNGIN_API_DOCS_LINK } from '@/services/constants';
import { OrganizationSelector } from '@/app/components/organization-selector';
export function HeaderBar() {
  const auth = useAuth();
  const router = useRouter();

  if (!auth.isAuthenticated) return null;

  return (
    <Flex
      justify="between"
      align="center"
      p={'4'}
      style={{
        borderBottom: '1px solid var(--gray-5)',
      }}
    >
      <Heading onClick={() => router.push('/')}>{PRODUCT_NAME}</Heading>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <AvatarIcon width="24" height="24" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger>
              <GearIcon /> Organizations
            </DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent>
              <Flex direction="column" gap="3">
                <Flex direction="column" gap="1">
                  <Text size="2">Choose Organization:</Text>
                  <OrganizationSelector />
                </Flex>
                <Button onClick={() => router.push('/organizations')}>
                  View all organizations <ArrowRightIcon />
                </Button>
              </Flex>
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
          <DropdownMenu.Separator />
          <DropdownMenu.Item onClick={() => window.open(XNGIN_API_DOCS_LINK, '_blank', 'noopener')}>
            <RocketIcon />
            API Documentation
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          {auth.userEmail.endsWith('@agency.fund') && (
            <>
              <DropdownMenu.Item onClick={() => eval('undefinedFunction()')}>
                <ExclamationTriangleIcon />
                Trigger error
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
            </>
          )}
          <DropdownMenu.Item color="red" onClick={auth.logout}>
            <ExitIcon />
            Logout
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </Flex>
  );
}
