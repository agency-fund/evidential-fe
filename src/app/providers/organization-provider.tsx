'use client';

import { OrganizationSummary } from '@/api/methods.schemas';
import { createContext, PropsWithChildren, useContext, useEffect } from 'react';
import { useListOrganizations } from '@/api/admin';
import { useAuth } from './auth-provider';
import { useLocalStorage } from '@/app/providers/use-local-storage';
import { Button, Callout, Flex, Text } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { XSpinner } from '@/app/components/x-spinner';
import { GenericErrorCallout } from '@/app/components/generic-error';
import { ApiError } from '@/services/orval-fetch';

const CURRENT_ORG_ID_KEY = 'org_id' as const;

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
    if (orgsList === undefined || !orgsList.items.length) return;

    const storedOrgExists = orgsList.items.some((org) => org.id === orgId);
    if (storedOrgExists) return;
    setOrgId(orgsList.items[0].id);
  }, [orgsList, orgId, setOrgId]);

  if (isLoading) {
    return <XSpinner message="Loading organizations..." />;
  }

  if (error) {
    if (error instanceof ApiError && error.response.status == 403) {
      return (
        <Flex direction="column" gap="3" p="4" align="center">
          <Callout.Root color={'red'}>
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>Please contact evidential-support@agency.fund for access.</Callout.Text>
          </Callout.Root>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Flex>
      );
    } else {
      return <GenericErrorCallout title={'Failed to fetch organizations'} error={error} />;
    }
  }
  if (!auth.isAuthenticated || orgsList === undefined) {
    return <CurrentOrganizationContext.Provider value={null}>{children}</CurrentOrganizationContext.Provider>;
  }

  const organizations = orgsList.items;
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
