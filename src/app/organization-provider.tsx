'use client';

import { OrganizationSummary } from '@/api/methods.schemas';
import { createContext, PropsWithChildren, useContext, useEffect } from 'react';
import { useListOrganizations } from '@/api/admin';
import { useAuth } from './auth-provider';
import { useLocalStorage } from '@/services/use-local-storage';
import { Button, Flex, Spinner, Text } from '@radix-ui/themes';
import { isHttpOk } from '@/services/typehelper';

type OrganizationContext = {
  current: OrganizationSummary;
  available: OrganizationSummary[];
} | null;

const CurrentOrganizationContext = createContext<OrganizationContext | undefined>(undefined);

export function useCurrentOrganization() {
  const context = useContext(CurrentOrganizationContext);
  if (context === undefined) {
    throw new Error('useCurrentOrganization must be used within an OrganizationProvider');
  }
  return context;
}

const CURRENT_ORG_ID_KEY = 'org_id' as const;

export function OrganizationProvider({ children }: PropsWithChildren) {
  const auth = useAuth();
  const {
    data: orgsList,
    isLoading,
    error,
  } = useListOrganizations({
    swr: {
      enabled: auth.isAuthenticated,
    },
  });
  const [orgId, setOrgId] = useLocalStorage<string>(CURRENT_ORG_ID_KEY);

  // If the localstorage org_id refers to an org that the user doesn't have access to, update it to be the first one
  // that they do have access to.
  useEffect(() => {
    if (!isHttpOk(orgsList) || !orgsList.data.items.length) return;

    const organizations = orgsList.data.items;
    const storedOrgExists = organizations.some((org) => org.id === orgId);
    if (storedOrgExists) return;
    setOrgId(organizations[0].id);
  }, [orgsList, orgId, setOrgId]);
  if (isLoading) {
    return (
      <Flex direction="column" gap="3" align="center">
        <Spinner />
        <Text size="2">Loading organization information...</Text>
      </Flex>
    );
  }
  if (error) {
    console.error('Error loading organizations', error);
    return (
      <Flex direction="column" gap="3" align="center">
        <Text>Unable to load your organization information.</Text>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </Flex>
    );
  }
  if (!auth.isAuthenticated || !isHttpOk(orgsList)) {
    return <CurrentOrganizationContext.Provider value={null}>{children}</CurrentOrganizationContext.Provider>;
  }

  const organizations = orgsList.data.items;
  if (organizations.length === 0) {
    return <Text>Sorry, you are not a member of any organizations.</Text>;
  }

  const currentOrgId = orgId ?? organizations[0].id;
  const current = organizations.find((v) => v.id == currentOrgId) || organizations[0];
  return (
    <CurrentOrganizationContext.Provider
      value={{
        current: current,
        available: organizations,
      }}
    >
      {children}
    </CurrentOrganizationContext.Provider>
  );
}
