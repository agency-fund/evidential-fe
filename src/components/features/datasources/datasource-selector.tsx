import { Flex, Select, Text } from '@radix-ui/themes';
import { ListDatasourcesResponse } from '@/api/methods.schemas';

export function DatasourceSelector({
  selectedDatasource,
  setSelectedDatasource,
  datasourcesData,
}: {
  selectedDatasource: string;
  setSelectedDatasource: (value: string) => void;
  datasourcesData: ListDatasourcesResponse;
}) {
  const hasDataSources = datasourcesData.items.length > 0;

  return (
    <Flex align="center" gap="2">
      {hasDataSources ? (
        <Select.Root value={selectedDatasource} onValueChange={setSelectedDatasource}>
          <Select.Trigger placeholder="Select a datasource" />
          <Select.Content>
            {datasourcesData.items.map((datasource) => (
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
