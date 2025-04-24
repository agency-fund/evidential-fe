'use client';
import { Box, Card, Code, Flex, Text } from '@radix-ui/themes';
import { CopyToClipBoard } from '@/app/components/buttons/copy-to-clipboard';

interface CodeSnippetCardProps {
  title?: string;
  content: string;
  height?: string;
  tooltipContent?: string;
}

export function CodeSnippetCard({
  title,
  content,
  height = 'auto',
  tooltipContent = 'Copy to clipboard',
}: CodeSnippetCardProps) {
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

            <CopyToClipBoard content={content} tooltipContent={tooltipContent} />
          </Flex>

          <Flex align="start" gap="2" overflowY="auto" height={height}>
            <Code style={{ whiteSpace: 'pre-wrap', padding: '10px' }}>{content}</Code>
          </Flex>
        </Flex>
      </Card>
    </Box>
  );
}
