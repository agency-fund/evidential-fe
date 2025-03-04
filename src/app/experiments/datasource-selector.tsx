import { listDatasourcesResponse } from '@/api/admin';
import { Flex, Select, Text } from '@radix-ui/themes';

export function DatasourceSelector({
  selectedDatasource,
  setSelectedDatasource,
  datasourcesData,
}: {
  selectedDatasource: string;
  setSelectedDatasource: (value: string) => void;
  datasourcesData: listDatasourcesResponse;
}) {
  const hasDataSources = datasourcesData.data.items.length > 0;

  return (
    <Flex align="center" gap="2">
      <Text size="2" weight="bold">
        Data Source:
      </Text>
      {hasDataSources ? (
        <Select.Root value={selectedDatasource} onValueChange={setSelectedDatasource}>
          <Select.Trigger placeholder="Select a datasource" />
          <Select.Content>
            {datasourcesData.data.items.map((datasource) => (
              <Select.Item key={datasource.id} value={datasource.id}>
                {datasource.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      ) : (
        <Text color="gray">No datasources available</Text>
      )}
    </Flex>
  );
}
