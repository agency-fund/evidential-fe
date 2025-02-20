'use client';

import { OrganizationSummary } from '@/api/methods.schemas';
import { createContext, PropsWithChildren, useContext } from 'react';
import { useListOrganizations } from '@/api/admin';
import { useAuth } from './auth-provider';
import { useLocalStorage } from '@/services/use-local-storage';
import { Text, Spinner } from '@radix-ui/themes';

type OrganizationContext = {
  current: OrganizationSummary;
  available: OrganizationSummary[];
} | null;

const CurrentOrganizationContext = createContext<OrganizationContext>(null);

export function useCurrentOrganization() {
  const context = useContext(CurrentOrganizationContext);
  if (context === null) {
    throw new Error('useCurrentOrganization must be used within an OrganizationProvider');
  }
  return context;
}

export function OrganizationProvider({ children }: PropsWithChildren) {
  const auth = useAuth();
  const { data: orgsResponse, isLoading } = useListOrganizations();
  const [orgId, setOrgId] = useLocalStorage<string>('org_id');

  if (isLoading) {
    return <Spinner />;
  }

  if (!auth.isAuthenticated) {
    return <CurrentOrganizationContext.Provider value={null}>{children}</CurrentOrganizationContext.Provider>;
  }

  const organizations = orgsResponse?.data.items ?? [];
  if (organizations.length === 0) {
    return <Text>Sorry, you are not a member of any organizations.</Text>;
  }

  const currentOrgId = orgId ?? organizations[0].id;
  const current = organizations.find((v) => v.id == currentOrgId);
  if (current === undefined) {
    setOrgId(null);
    return <CurrentOrganizationContext.Provider value={null}>{children}</CurrentOrganizationContext.Provider>;
  }
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
