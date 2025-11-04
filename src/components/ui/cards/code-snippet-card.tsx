'use client';
import { Box, Card, Code, Flex, Text } from '@radix-ui/themes';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { prettyJSON } from '@/services/json-utils';

interface CodeSnippetCardProps {
  title?: string;
  content: string | object;
  height?: string;
  tooltipContent?: string;
  variant?: 'ghost' | 'surface';
}

export function CodeSnippetCard({
  title,
  content,
  height = 'auto',
  tooltipContent = 'Copy to clipboard',
  variant = 'surface',
}: CodeSnippetCardProps) {
  // Format the content as a JSON string if it's an object.
  const formattedContent = typeof content === 'object' ? prettyJSON(content) : content;

  // Auto-detect if we should fill width based on newlines.
  const shouldFill = formattedContent.includes('\n');

  return (
    <Box my="2">
      <Card variant={variant}>
        <Flex direction="column" gap="4">
          <Flex direction="row" justify={title ? 'between' : 'end'} gap="2" align="center">
            {title && (
              <Text as="div" size="2" weight="bold">
                {title}
              </Text>
            )}

            <CopyToClipBoard content={formattedContent} tooltipContent={tooltipContent} />
          </Flex>

          <Flex align="start" gap="2" overflowY="auto" height={height} width={shouldFill ? '100%' : 'auto'}>
            <Code
              style={{
                whiteSpace: 'pre-wrap',
                padding: '10px',
                width: shouldFill ? '100%' : 'auto',
              }}
            >
              {formattedContent}
            </Code>
          </Flex>
        </Flex>
      </Card>
    </Box>
  );
}
