'use client';
import { Flex, Heading, Spinner, Text } from '@radix-ui/themes';
import { useListApiKeys } from '@/api/admin';
import { isHttpOk } from '@/services/typehelper';
import { CreateApiKeyDialog } from '@/app/datasourcedetails/create-api-key-dialog';
import { ApiKeysTable } from '@/app/datasourcedetails/api-keys-table';

export function ApiKeysSection({ datasourceId }: { datasourceId: string }) {
  const { data: apiKeys, isLoading, error } = useListApiKeys();

  if (isLoading) {
    return <Spinner />;
  }

  if (error || !isHttpOk(apiKeys)) {
    return <Text>Error loading API keys: {JSON.stringify(error)}</Text>;
  }

  const filteredApiKeys = apiKeys.data.items.filter((key) => key.datasource_id === datasourceId);

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between">
        <Heading size="4">API Keys</Heading>
        <CreateApiKeyDialog datasourceId={datasourceId} />
      </Flex>
      <ApiKeysTable apiKeys={filteredApiKeys} />
    </Flex>
  );
}
