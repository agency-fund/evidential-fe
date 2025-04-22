'use client';
import { Box, Card, Code, Flex, Text } from '@radix-ui/themes';
import { CopyToClipBoard } from '@/app/components/buttons';

interface CodeSnippetCardProps {
  title?: string;
  content: string;
}

export function CodeSnippetCard({ title, content }: CodeSnippetCardProps) {
  return (
    <Box my="2">
      <Card>
        <Flex direction="column" gap="4">
          <Flex direction="row" justify={title ? 'between' : 'end'} gap="2" align="center">
            {title && (
              <Text as="div" size="2" weight="bold">
                {title}
              </Text>
            )}

            <CopyToClipBoard content={content} />
          </Flex>

          <Flex align="start" gap="2">
            <Code style={{ whiteSpace: 'pre-wrap', padding: '10px' }}>{content}</Code>
          </Flex>
        </Flex>
      </Card>
    </Box>
  );
}
