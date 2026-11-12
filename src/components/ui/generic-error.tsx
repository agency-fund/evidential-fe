'use client';
import { Callout, Flex, Text } from '@radix-ui/themes';
import { ApiError, ApiRequestValidationError, getErrorMessage, isApiDwhError } from '@/services/orval-fetch';
import { apiErrorDetails } from '@/services/error-report';
import { DwhErrorCallout } from '@/components/ui/dwh-error-callout';
import { ErrorCallout } from '@/components/ui/error-callout';

const ValidationErrorDetails = ({ error }: { error: ApiRequestValidationError }) => (
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

const validationLines = (error: ApiRequestValidationError): string[] => [
  'Validation Error (422)',
  ...(error.data.detail ?? []).map((detail) => `${detail.loc.join('.')}: ${detail.msg} (${detail.type})`),
];

const formattedErrorLines = (error: Error): string[] =>
  error instanceof ApiRequestValidationError ? validationLines(error) : [getErrorMessage(error)];

const FormattedError = ({ error }: { error: Error }) =>
  error instanceof ApiRequestValidationError ? (
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
    <ErrorCallout title={title} bodyText={bodyText} details={details}>
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
  datasourceId?: string;
}

export function GenericErrorCallout({ title, message, error, datasourceId }: GenericErrorCalloutProps) {
  return (
    <Flex direction="column" width="100%">
      {isApiDwhError(error) ? (
        <DwhErrorCallout title={title} error={error} datasourceId={datasourceId} />
      ) : (
        <PlainErrorCallout title={title} message={message} error={error} />
      )}
    </Flex>
  );
}
