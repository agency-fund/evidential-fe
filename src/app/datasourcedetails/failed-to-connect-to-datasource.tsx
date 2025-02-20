import { Callout, Flex, IconButton, Text, TextArea } from '@radix-ui/themes';
import { CopyIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { EditDatasourceDialog } from '@/app/organizationdetails/edit-datasource-dialog';

export function FailedToConnectToDatasource({ data, datasourceId }: { data: { data: unknown }; datasourceId: string }) {
  const debugValue = JSON.stringify(data.data);
  return (
    <Flex direction="column" gap="3">
      <Callout.Root color={'red'}>
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>
          <Flex direction="column" gap="3">
            <Text>Failed to connect to datasource</Text>
            <Flex gap="2">
              <TextArea variant="soft" readOnly={true} value={debugValue} style={{ width: '80vw' }} />
              <IconButton size="2" variant="soft" onClick={() => navigator.clipboard.writeText(debugValue)}>
                <CopyIcon />
              </IconButton>
            </Flex>
            <Text>Please confirm the datasource connection settings are correct.</Text>
          </Flex>
        </Callout.Text>
      </Callout.Root>
      <EditDatasourceDialog datasourceId={datasourceId} variant="button" />
    </Flex>
  );
}
