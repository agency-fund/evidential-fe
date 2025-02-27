import { Callout, Flex, IconButton, Text, TextArea } from '@radix-ui/themes';
import { CopyIcon, InfoCircledIcon } from '@radix-ui/react-icons';

export function GenericErrorCallout({ title, message }: { title: string; message: string }) {
  return (
    <Callout.Root color={'red'}>
      <Callout.Icon>
        <InfoCircledIcon />
      </Callout.Icon>
      <Callout.Text>
        <Flex direction="column" gap="3">
          <Text>{title}</Text>
          <Flex gap="2">
            <TextArea variant="soft" readOnly={true} value={message} style={{ width: '80vw' }} />
            <IconButton size="2" variant="soft" onClick={() => navigator.clipboard.writeText(message)}>
              <CopyIcon />
            </IconButton>
          </Flex>
        </Flex>
      </Callout.Text>
    </Callout.Root>
  );
}
