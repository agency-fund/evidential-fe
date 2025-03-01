import { Flex, IconButton, Text } from '@radix-ui/themes';
import { CopyIcon } from '@radix-ui/react-icons';

export function ClippableText({ text }: { text: string }) {
  return (
    <Flex gap={'1'}>
      <Text>{text}</Text>
      <IconButton size="1" variant="ghost" onClick={() => navigator.clipboard.writeText(text)}>
        <CopyIcon />
      </IconButton>
    </Flex>
  );
}
