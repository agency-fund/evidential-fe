'use client';

import { API_BASE_URL } from '@/services/constants';
import { Card, Code, Flex, Tabs, Text } from '@radix-ui/themes';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';

const generateSamples = (key: string | undefined, datasourceId: string) => [
  {
    id: 'curl',
    title: 'Curl',
    code: `curl \\\n  -H "X-API-Key: ${key}" \\\n  -H "Datasource-ID: ${datasourceId}" \\\n  ${API_BASE_URL}/v1/experiments`,
  },
  {
    id: 'py',
    title: 'Python',
    code: `import httpx

response = httpx.get(
    "${API_BASE_URL}/v1/experiments",
    headers={
        "X-API-Key": "${key}",
        "Datasource-ID": "${datasourceId}"
    },
)
`,
  },
];

export const ApiKeySnippetsContent = ({
  createdKey,
  datasourceId,
}: {
  createdKey: { key: string } | undefined;
  datasourceId: string;
}) => {
  const samples = generateSamples(createdKey?.key || '', datasourceId);

  return (
    <Flex direction="column" gap="3">
      <Card>
        <Text weight={'bold'} as={'div'}>
          Example Clients
        </Text>
        <Tabs.Root defaultValue={'curl'}>
          <Tabs.List>
            {samples.map(({ id, title }) => (
              <Tabs.Trigger key={id} value={id}>
                {title}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {samples.map(({ id, code }) => (
            <Tabs.Content value={id} key={id}>
              <Flex align="start" gap="2">
                <Code
                  style={{
                    whiteSpace: 'pre-wrap',
                    padding: '10px',
                    width: '100%',
                  }}
                >
                  {code}
                </Code>
                <CopyToClipBoard content={code} />
              </Flex>
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </Card>
    </Flex>
  );
};
