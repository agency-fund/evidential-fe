import { prettyJSON } from '@/services/json-utils';
import { Code, Flex } from '@radix-ui/themes';

export const Preformatted = ({ content }: { content: object | string }) => {
  const formattedContent = typeof content === 'object' ? prettyJSON(content) : content;
  const shouldFill = formattedContent.includes('\n');
  return (
    <Flex align="start" gap="2" overflowY="auto" height={'auto'} width={shouldFill ? '100%' : 'auto'}>
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
  );
};
