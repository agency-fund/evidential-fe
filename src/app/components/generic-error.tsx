import { Callout, Code, Flex } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';

export function GenericErrorCallout({ title, message }: { title: string; message: string }) {
  return (
    <Flex gap={'3'} direction={'column'} width={'100%'}>
      <Callout.Root color={'red'}>
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>{title}</Callout.Text>
      </Callout.Root>
      <Code style={{ whiteSpace: 'pre', fontFamily: 'monospace' }} variant={'outline'} m={'3'}>
        {message}
      </Code>
    </Flex>
  );
}
