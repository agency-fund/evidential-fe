'use client';
import { Callout, Code, Flex, Text } from '@radix-ui/themes';
import Link from 'next/link';
import { DwhErrorCode } from '@/api/methods.schemas';
import { ApiDwhError } from '@/services/orval-fetch';
import { dwhErrorDetails } from '@/services/error-report';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { ErrorCallout } from '@/components/ui/error-callout';

const CODES_FIXED_BY_EDITING_THE_DATA_SOURCE: ReadonlySet<DwhErrorCode> = new Set([
  DwhErrorCode.dwh_connection,
  DwhErrorCode.dwh_dns,
  DwhErrorCode.dwh_authentication,
  DwhErrorCode.dwh_configuration,
]);

const Hint = ({ hint, command }: { hint: string | null; command: string | null }) => (
  <Flex direction="column" gap="1">
    {hint === null ? null : <Text size="2">{hint}</Text>}
    {command === null ? null : (
      <Flex align="center" gap="2">
        <Code size="2" style={{ whiteSpace: 'pre-wrap' }}>
          {command}
        </Code>
        <CopyToClipBoard content={command} />
      </Flex>
    )}
  </Flex>
);

interface DwhErrorCalloutProps {
  title: string;
  error: ApiDwhError;
  datasourceId?: string;
}

export function DwhErrorCallout({ title, error, datasourceId }: DwhErrorCalloutProps) {
  const showEditLink = datasourceId !== undefined && CODES_FIXED_BY_EDITING_THE_DATA_SOURCE.has(error.code);
  const bodyText = [error.message, error.hint, error.hintCommand].filter((line): line is string => line !== null);

  return (
    <ErrorCallout title={title} bodyText={bodyText} details={() => dwhErrorDetails(error, window.location.href)}>
      <Callout.Text>{error.message}</Callout.Text>
      {error.hint === null && error.hintCommand === null ? null : (
        <Hint hint={error.hint} command={error.hintCommand} />
      )}
      {showEditLink ? (
        <Text size="2">
          <Link href={`/datasources/${datasourceId}`}>Edit data source</Link>
        </Text>
      ) : null}
    </ErrorCallout>
  );
}
