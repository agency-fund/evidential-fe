'use client';
import { DropdownMenu, Flex, Heading, IconButton, Box } from '@radix-ui/themes';
import { useAuth } from '@/app/providers/auth-provider';
import { AvatarIcon, ExitIcon, GearIcon, RocketIcon, ArrowLeftIcon, BackpackIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { PRODUCT_NAME, XNGIN_API_DOCS_LINK } from '@/services/constants';
import { useListOrganizations } from '@/api/admin';
import { useState } from 'react';
import { OrganizationSelector } from '@/app/components/organization-selector';
import Link from 'next/link';
export function HeaderBar() {
  const auth = useAuth();
  const router = useRouter();
  const { data: orgsResponse } = useListOrganizations();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);

  if (!auth.isAuthenticated) return null;

  const organizations = orgsResponse?.items || [];
  const hasMultipleOrgs = organizations.length > 1;
  const isPrivileged = auth.userEmail.endsWith('@agency.fund');

  return (
    <Flex
      justify="between"
      align="center"
      p={'4'}
      style={{
        borderBottom: '1px solid var(--gray-5)',
      }}
      asChild
    >
      <header>
        {/* Using Link instead of router.push for accessibility */}
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Heading>{PRODUCT_NAME}</Heading>
        </Link>
        <nav>
          <DropdownMenu.Root
            open={dropdownOpen}
            onOpenChange={(open) => {
              setDropdownOpen(open);
              if (!open) setShowOrgMenu(false);
            }}
          >
            <DropdownMenu.Trigger>
              <IconButton
                variant="ghost"
                color="gray"
                size="2"
                aria-label="User menu"
                aria-controls="user-menu"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <AvatarIcon width="24" height="24" />
              </IconButton>
            </DropdownMenu.Trigger>
            {!showOrgMenu ? (
              <DropdownMenu.Content id="user-menu">
                {/* Main menu */}
                {hasMultipleOrgs && (
                  <>
                    <DropdownMenu.Item
                      onSelect={(event) => {
                        event.preventDefault();
                        setShowOrgMenu(true);
                      }}
                      aria-haspopup="true"
                      aria-expanded={showOrgMenu}
                      aria-controls="organizations-menu"
                    >
                      <BackpackIcon /> Organizations
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                  </>
                )}
                {isPrivileged && (
                  <>
                    <DropdownMenu.Item
                      onClick={() => router.push('/organizations')}
                      aria-haspopup="true"
                      aria-expanded={showOrgMenu}
                      aria-controls="organizations-menu"
                    >
                      <GearIcon /> Manage Organizations
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                  </>
                )}

                <DropdownMenu.Item asChild>
                  {/* Using a instead of router.push for accessibility */}
                  <a
                    href={XNGIN_API_DOCS_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="API Documentation (opens in a new tab)"
                  >
                    <RocketIcon /> API Documentation
                  </a>
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item color="red" onClick={auth.logout}>
                  <ExitIcon /> Logout
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            ) : (
              <DropdownMenu.Content id="organizations-menu">
                {/* Organizations list view */}
                <DropdownMenu.Item
                  onSelect={(event) => {
                    event.preventDefault();
                    setShowOrgMenu(false);
                  }}
                >
                  <ArrowLeftIcon /> Back
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <Box p="2">
                  <OrganizationSelector />
                </Box>
              </DropdownMenu.Content>
            )}
          </DropdownMenu.Root>
        </nav>
      </header>
    </Flex>
  );
}
