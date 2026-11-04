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

/** A title as text, with the table name kept apart so that it can be shown as code. */
type TitlePart = string | { table: string };

const titleParts = (error: ApiDwhError): TitlePart[] => {
  const table = error.tableName === null ? null : { table: error.tableName };
  switch (error.code) {
    case DwhErrorCode.dwh_permission_denied:
      return table === null
        ? ["Evidential can't read from the data warehouse"]
        : ["Evidential can't read table ", table];
    case DwhErrorCode.dwh_table_not_found:
      return table === null ? ["The table wasn't found"] : ['Table ', table, " wasn't found"];
    case DwhErrorCode.dwh_column_not_found:
      return ["A column wasn't found"];
    case DwhErrorCode.dwh_database_not_found:
      return ["The database wasn't found"];
    case DwhErrorCode.dwh_authentication:
      return ['The data warehouse rejected the credentials'];
    case DwhErrorCode.dwh_connection:
      return ["Evidential couldn't connect to the data warehouse"];
    case DwhErrorCode.dwh_dns:
      return ["The data warehouse hostname couldn't be resolved"];
    case DwhErrorCode.dwh_timeout:
      return ["The data warehouse didn't respond in time"];
    case DwhErrorCode.dwh_query_failed:
      return ["The data warehouse couldn't run the query"];
    case DwhErrorCode.dwh_configuration:
      return ["The data source configuration isn't valid"];
  }
};

const titleText = (parts: TitlePart[]): string =>
  parts.map((part) => (typeof part === 'string' ? part : part.table)).join('');

const TitleView = ({ parts }: { parts: TitlePart[] }) => (
  <>{parts.map((part) => (typeof part === 'string' ? part : <Code key={part.table}>{part.table}</Code>))}</>
);

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
  error: ApiDwhError;
  datasourceId?: string;
}

export function DwhErrorCallout({ error, datasourceId }: DwhErrorCalloutProps) {
  const title = titleParts(error);
  const showEditLink = datasourceId !== undefined && CODES_FIXED_BY_EDITING_THE_DATA_SOURCE.has(error.code);
  const bodyText = [error.message, error.hint, error.hintCommand].filter((line): line is string => line !== null);

  return (
    <ErrorCallout
      title={<TitleView parts={title} />}
      titleText={titleText(title)}
      bodyText={bodyText}
      details={() => dwhErrorDetails(error, window.location.href)}
    >
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
