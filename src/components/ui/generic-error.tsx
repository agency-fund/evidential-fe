'use client';
import { Callout, Flex, Text } from '@radix-ui/themes';
import { ApiError, ApiValidationError, getErrorMessage } from '@/services/orval-fetch';
import { apiErrorDetails } from '@/services/error-report';
import { ErrorCallout } from '@/components/ui/error-callout';

const ValidationErrorDetails = ({ error }: { error: ApiValidationError }) => (
  <Flex direction="column" gap="2">
    <Text weight="bold">Validation Error (422)</Text>
    {error.data.detail ? (
      <Flex direction="column" gap="1">
        <Text size="2">Validation details:</Text>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          {error.data.detail.map((detail, index) => (
            <li key={index}>
              <Text size="2" wrap="wrap">
                <strong>{detail.loc.join('.')}</strong>: {detail.msg} ({detail.type})
              </Text>
            </li>
          ))}
        </ul>
      </Flex>
    ) : null}
  </Flex>
);

const validationLines = (error: ApiValidationError): string[] => [
  'Validation Error (422)',
  ...(error.data.detail ?? []).map((detail) => `${detail.loc.join('.')}: ${detail.msg} (${detail.type})`),
];

/** The lines FormattedError shows, as plain text. */
const formattedErrorLines = (error: Error): string[] =>
  error instanceof ApiValidationError ? validationLines(error) : [getErrorMessage(error)];

const FormattedError = ({ error }: { error: Error }) =>
  error instanceof ApiValidationError ? (
    <ValidationErrorDetails error={error} />
  ) : (
    <Callout.Text>{getErrorMessage(error)}</Callout.Text>
  );

interface PlainErrorCalloutProps {
  title: string;
  message?: string;
  error?: Error;
}

const PlainErrorCallout = ({ title, message, error }: PlainErrorCalloutProps) => {
  const messageLines = message === undefined ? [] : message.split('\n');
  const bodyText = [...messageLines, ...(error === undefined ? [] : formattedErrorLines(error))];
  const details = error instanceof ApiError ? () => apiErrorDetails(error, window.location.href) : undefined;

  return (
    <ErrorCallout title={title} titleText={title} bodyText={bodyText} details={details}>
      {messageLines.map((line, index) => (
        <Callout.Text key={index}>{line}</Callout.Text>
      ))}
      {error === undefined ? null : <FormattedError error={error} />}
    </ErrorCallout>
  );
};

interface GenericErrorCalloutProps {
  title: string;
  message?: string;
  error?: Error;
}

export function GenericErrorCallout({ title, message, error }: GenericErrorCalloutProps) {
  return (
    <Flex direction="column" width="100%">
      <PlainErrorCallout title={title} message={message} error={error} />
    </Flex>
  );
}
