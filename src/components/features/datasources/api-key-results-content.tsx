'use client';

import { Callout, Card, Code, Flex, Text } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';

export const ApiKeyResultsContent = ({ createdKey }: { createdKey: { key: string } | undefined }) => (
  <Flex direction="column" gap="3">
    <Callout.Root color={'red'}>
      <Callout.Icon>
        <InfoCircledIcon />
      </Callout.Icon>
      <Callout.Text>This API key will only be displayed once.</Callout.Text>
    </Callout.Root>
    <Card>
      <Text weight={'bold'} as={'div'}>
        API Key
      </Text>
      <Flex direction={'row'} justify={'between'} p={'3'} width={'100%'}>
        <Code>{createdKey?.key}</Code>
        <CopyToClipBoard content={createdKey?.key || ''} />
      </Flex>
    </Card>
  </Flex>
);
