'use client';
import { Flex, Heading, Spinner, Text } from '@radix-ui/themes';
import { useListApiKeys } from '@/api/admin';
import { CreateApiKeyDialog } from '@/app/components/features/datasources/create-api-key-dialog';
import { ApiKeysTable } from '@/app/components/features/datasources/api-keys-table';

export function ApiKeysSection({ datasourceId }: { datasourceId: string }) {
  const { data, isLoading, error } = useListApiKeys(datasourceId);

  if (isLoading) {
    return <Spinner />;
  }

  if (error || !data) {
    return <Text>Error loading API keys: {JSON.stringify(error)}</Text>;
  }

  const filteredApiKeys = data.items.filter((key) => key.datasource_id === datasourceId);

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between">
        <Heading size="4">API Keys</Heading>
        <CreateApiKeyDialog datasourceId={datasourceId} />
      </Flex>
      <ApiKeysTable apiKeys={filteredApiKeys} datasourceId={datasourceId} />
    </Flex>
  );
}
