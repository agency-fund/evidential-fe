import { Box, Code, Flex, Tabs } from '@radix-ui/themes';
import { CopyToClipBoard } from '@/app/components/buttons/copy-to-clipboard';
import { API_BASE_URL } from '@/services/constants';

const snippets = await import('./snippets.json');

export function ExperimentAssignmentCodeSnippet({
  datasourceId,
  experimentId,
}: {
  datasourceId: string;
  experimentId: string;
}) {
  const curlExample = `curl -H "X-API-Key: my-api-key" -H "Datasource-ID: ${datasourceId}" ${API_BASE_URL}/v1/experiment/${experimentId}/assignments/participant-type-id`;

  const Variant = ({ tabLabel, value }: { tabLabel: string; value: string }) => {
    return (
      <Tabs.Content value={tabLabel}>
        <Flex direction={'row'} gap={'3'}>
          <Code
            style={{
              whiteSpace: 'pre-wrap',
              padding: '10px',
              width: 'auto',
            }}
          >
            {value}
          </Code>
          <CopyToClipBoard content={value} />
        </Flex>
      </Tabs.Content>
    );
  };
  return (
    <Tabs.Root defaultValue={'shell'}>
      <Tabs.List>
        <Tabs.Trigger value="shell">Shell</Tabs.Trigger>
        <Tabs.Trigger value="python">Python</Tabs.Trigger>
        <Tabs.Trigger value="php">PHP</Tabs.Trigger>
        <Tabs.Trigger value="ruby">Ruby</Tabs.Trigger>
        <Tabs.Trigger value="rust">Rust</Tabs.Trigger>
      </Tabs.List>

      <Box pt={'3'}>
        <Variant tabLabel={'shell'} value={curlExample} />
        <Variant tabLabel={'python'} value={snippets['python']} />
        <Variant tabLabel={'php'} value={'TODO'} />
        <Variant tabLabel={'rust'} value={'TODO'} />
      </Box>
    </Tabs.Root>
  );
}
