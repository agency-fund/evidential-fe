'use client';
import { Callout, Code, Flex, Text } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { ApiError, ApiValidationError } from '@/services/orval-fetch';
import { HTTPValidationError } from '@/api/methods.schemas';

const FormattedError = ({ error }: { error: Error }) => {
  if (error instanceof ApiError && error.response) {
    const response = error.response as { status: number; data: unknown };
    return (
      <Flex direction="column" gap="2">
        <Text weight="bold">API Error: {response.status}</Text>
        {response.data !== undefined && response.data !== null && (
          <Flex direction="column" gap="1">
            <Text size="2">Response data:</Text>
            <Code style={{ whiteSpace: 'pre-wrap' }}>
              {typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : String(response.data)}
            </Code>
          </Flex>
        )}
      </Flex>
    );
  }

  if (error instanceof ApiValidationError) {
    const validationError = error.data as HTTPValidationError;
    return (
      <Flex direction="column" gap="2">
        <Text weight="bold">Validation Error (422)</Text>
        {validationError.detail && (
          <Flex direction="column" gap="1">
            <Text size="2">Validation details:</Text>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              {validationError.detail.map((detail, index) => (
                <li key={index}>
                  <Text size="2" wrap="wrap">
                    <strong>{detail.loc.join('.')}</strong>: {detail.msg} ({detail.type})
                  </Text>
                </li>
              ))}
            </ul>
          </Flex>
        )}
      </Flex>
    );
  }

  // Default case for other errors
  return (
    <Flex direction="column" gap="1">
      <Text weight="bold">{error.name || 'Error'}</Text>
      <Text>{error.message}</Text>
    </Flex>
  );
};

export function GenericErrorCallout({ title, message, error }: { title: string; message?: string; error?: Error }) {
  return (
    <Flex gap={'3'} direction={'column'} width={'100%'}>
      <Callout.Root color={'red'}>
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>{title}</Callout.Text>
      </Callout.Root>
      <Code style={{ whiteSpace: 'pre', fontFamily: 'monospace' }} variant={'outline'} m={'3'}>
        {message ? message : <></>}
        {error && <FormattedError error={error} />}
      </Code>
    </Flex>
  );
}
