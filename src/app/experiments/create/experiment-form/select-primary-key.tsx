import { Flex, Select, Text } from '@radix-ui/themes';
import { useInspectTableInDatasource } from '@/api/admin';
import { XSpinner } from '@/components/ui/x-spinner';

interface SelectPrimaryKeyProps {
  datasourceId: string;
  tableName: string;
  value: string | undefined;
  onChange: (value: string) => void;
}

export const SelectPrimaryKey = ({ datasourceId, tableName, value, onChange }: SelectPrimaryKeyProps) => {
  const { data: tableData, isLoading } = useInspectTableInDatasource(
    datasourceId,
    tableName,
    { refresh: false },
    {
      swr: {
        enabled: !!datasourceId && !!tableName,
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      },
    },
  );

  const uniqueIdFields = tableData?.detected_unique_id_fields ?? [];

  return (
    <Flex direction="column" gap="2">
      <Text as="label" size="2" weight="bold">
        Primary Key
      </Text>
      {isLoading ? (
        <XSpinner message="Loading fields..." />
      ) : (
        <Select.Root value={value ?? ''} onValueChange={onChange}>
          <Select.Trigger placeholder="Select primary key field" />
          <Select.Content>
            {uniqueIdFields.map((field) => (
              <Select.Item key={field} value={field}>
                {field}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      )}
    </Flex>
  );
};
