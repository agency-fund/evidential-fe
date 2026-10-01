'use client';
import { Callout, Code, Flex } from '@radix-ui/themes';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { ApiValidationError } from '@/services/orval-fetch';
import { PRODUCT_NAME } from '@/services/constants';

// Nested columns (e.g. BigQuery RECORD/STRUCT) reach the backend as "parent.child" field names. It
// rejects those with a 422 whose `input` is the offending name.
const getNestedFieldNames = (error: Error): string[] => {
  if (!(error instanceof ApiValidationError)) return [];
  return (error.data.detail ?? [])
    .filter((detail) => detail.loc.includes('field_name'))
    .map((detail) => detail.input)
    .filter((input): input is string => typeof input === 'string' && input.includes('.'));
};

interface TableInspectionErrorCalloutProps {
  tableName: string;
  error: Error;
}

/** Explains why a table's fields failed to load, with specific guidance when nested columns are the cause. */
export function TableInspectionErrorCallout({ tableName, error }: TableInspectionErrorCalloutProps) {
  const nestedFieldNames = getNestedFieldNames(error);

  if (nestedFieldNames.length === 0) {
    return <GenericErrorCallout title={`Failed to load fields for table ${tableName}`} error={error} />;
  }

  return (
    <Callout.Root color="amber" role="alert">
      <Callout.Icon>
        <ExclamationTriangleIcon />
      </Callout.Icon>
      <Flex direction="column" gap="2">
        <Callout.Text weight="bold">
          {PRODUCT_NAME} can&apos;t read the fields in {tableName}
        </Callout.Text>
        <Callout.Text>
          This table has nested columns, such as <Code>{nestedFieldNames[0]}</Code>. {PRODUCT_NAME} reads flat columns
          only, so nested fields (for example BigQuery RECORD or STRUCT columns) stop the field list from loading.
        </Callout.Text>
        <Callout.Text>
          To use this data, create a view that exposes the fields you need as top-level columns, then select that view
          here.
        </Callout.Text>
      </Flex>
    </Callout.Root>
  );
}
