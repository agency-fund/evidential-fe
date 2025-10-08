'use client';
import { DropdownMenu, Flex, Heading, IconButton, Text } from '@radix-ui/themes';
import { useAuth } from '@/providers/auth-provider';
import { ArrowLeftIcon, AvatarIcon, BackpackIcon, ExitIcon, GearIcon, RocketIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { PRODUCT_NAME, XNGIN_API_DOCS_LINK } from '@/services/constants';
import { useListOrganizations } from '@/api/admin';
import { useState } from 'react';
import { useLocalStorage } from '@/providers/use-local-storage';
import { CURRENT_ORG_ID_KEY, useCurrentOrganization } from '@/providers/organization-provider';
import Link from 'next/link';
import Image from 'next/image';

export function HeaderBar() {
  const auth = useAuth();
  const router = useRouter();
  const { data: orgsResponse } = useListOrganizations();
  const [dropdownOpen, setDropdownOpen] = useState<'closed' | 'main' | 'organizations'>('closed');
  const [orgId, setOrgId] = useLocalStorage<string>(CURRENT_ORG_ID_KEY);
  const currentOrganization = useCurrentOrganization();

  if (!auth.isAuthenticated) return null;

  const organizations = orgsResponse?.items || [];
  const hasMultipleOrgs = organizations.length > 1;

  const updateOrgId = (orgId: string) => {
    setOrgId(orgId);
    setDropdownOpen('closed');
    router.push('/');
  };

  return (
    <Flex
      justify="between"
      align="center"
      px="4"
      py="5"
      style={{
        borderBottom: '1px solid var(--gray-5)',
      }}
    >
      <Link href="/" style={{ textDecoration: 'none', color: 'inherit', lineHeight: "0"}}>
        <Image src="/evidential-logo.svg" alt="Evidential Logo" width={200} height={35}/>
      </Link>
      <DropdownMenu.Root
        open={dropdownOpen !== 'closed'}
        onOpenChange={(open) => {
          setDropdownOpen(open ? 'main' : 'closed');
        }}
      >
        <DropdownMenu.Trigger>
          <IconButton variant="ghost" color="gray" size="2">
            <AvatarIcon width="24" height="24" />
          </IconButton>
        </DropdownMenu.Trigger>

        {dropdownOpen === 'main' ? (
          <DropdownMenu.Content id="user-menu">
            {hasMultipleOrgs && (
              <>
                <DropdownMenu.Label>
                  {currentOrganization && (
                    <Text size="1" color="gray" align="center" style={{ width: '100%', display: 'block' }}>
                      {currentOrganization.current.name}
                    </Text>
                  )}
                </DropdownMenu.Label>

                <DropdownMenu.Item
                  onSelect={(event) => {
                    event.preventDefault();
                    setDropdownOpen('organizations');
                  }}
                >
                  <BackpackIcon /> Organizations
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
              </>
            )}
            {auth.isPrivileged && (
              <>
                <DropdownMenu.Item onClick={() => router.push('/organizations')}>
                  <GearIcon /> Manage Organizations
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
              </>
            )}

            <DropdownMenu.Item asChild>
              <a href={XNGIN_API_DOCS_LINK} target="_blank" rel="noopener noreferrer">
                <RocketIcon /> API Documentation
              </a>
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item color="red" onClick={auth.logout}>
              <ExitIcon /> Logout
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        ) : dropdownOpen === 'organizations' ? (
          <DropdownMenu.Content id="organizations-menu">
            {/* Organizations list view */}
            <DropdownMenu.Item
              onSelect={(event) => {
                event.preventDefault();
                setDropdownOpen('main');
              }}
            >
              <ArrowLeftIcon /> Back
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            {organizations.map((org) => (
              <DropdownMenu.Item
                key={org.id}
                onSelect={() => updateOrgId(org.id)}
                style={
                  org.id === orgId
                    ? {
                        backgroundColor: 'var(--accent-a3)',
                        color: 'var(--accent-a11)',
                      }
                    : {}
                }
              >
                {org.name}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        ) : null}
      </DropdownMenu.Root>
    </Flex>
  );
}
