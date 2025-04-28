'use client';
import { useListOrganizations } from '@/api/admin';
import { useLocalStorage } from '@/app/providers/use-local-storage';
import { Flex, Select, Text } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import { CURRENT_ORG_ID_KEY } from '@/app/providers/organization-provider';

export function OrganizationSelector() {
  const router = useRouter();
  const { data: orgsResponse, isLoading } = useListOrganizations();
  const [orgId, setOrgId] = useLocalStorage<string>(CURRENT_ORG_ID_KEY);

  const updateOrgId = (orgId: string) => {
    setOrgId(orgId);
    router.push('/');
  };

  if (isLoading) {
    return (
      <Text size="2" color="gray">
        Loading...
      </Text>
    );
  }

  if (!orgsResponse?.items.length) {
    return <Text>No organizations available.</Text>;
  }

  const organizations = orgsResponse.items;

  // If there's only one organization, just show its name
  if (organizations.length === 1) {
    return (
      <Text size="2" color="gray">
        {organizations[0].name}
      </Text>
    );
  }

  // For multiple organizations, show a dropdown
  const selectedOrg = orgId ?? organizations[0].id;
  return (
    <Flex gap="2" direction={'column'}>
      <Text size="2">Choose Organization:</Text>
      <Select.Root value={selectedOrg} onValueChange={updateOrgId}>
        <Select.Trigger />
        <Select.Content>
          {organizations.map((org) => (
            <Select.Item key={org.id} value={org.id}>
              {org.name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}
