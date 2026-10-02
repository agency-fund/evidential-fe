'use client';
import { Callout, Flex } from '@radix-ui/themes';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { ApiValidationError } from '@/services/orval-fetch';

interface TableInspectionErrorCalloutProps {
  tableName: string;
  error: Error;
}

/**
 * Explains why a table's fields failed to load. A 422 carries the backend's own explanation (e.g. the
 * table has nested columns), so its messages are shown as written; other failures get the generic error.
 */
export function TableInspectionErrorCallout({ tableName, error }: TableInspectionErrorCalloutProps) {
  const messages = error instanceof ApiValidationError ? (error.data.detail ?? []).map((detail) => detail.msg) : [];

  if (messages.length === 0) {
    return <GenericErrorCallout title={`Failed to load fields for table ${tableName}`} error={error} />;
  }

  return (
    <Callout.Root color="amber" role="alert">
      <Callout.Icon>
        <ExclamationTriangleIcon />
      </Callout.Icon>
      <Flex direction="column" gap="2">
        <Callout.Text weight="bold">Can&apos;t load fields for table {tableName}</Callout.Text>
        {messages.map((message, index) => (
          <Callout.Text key={index}>{message}</Callout.Text>
        ))}
      </Flex>
    </Callout.Root>
  );
}
