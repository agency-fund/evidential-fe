import { Badge, Callout, Flex, Heading, Table, Text } from '@radix-ui/themes';
import { Drift, TableDiff } from '@/api/methods.schemas';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

export function ParticipantDriftTable({ drift }: { drift: Drift }) {
  if (!drift.schema_diff || drift.schema_diff.length === 0) {
    return null;
  }

  const hasTableDeleted = drift.schema_diff.some((diff) => diff.type === 'table_deleted');

  return (
    <Flex direction="column" gap="2">
      <Heading size="4" color="red">
        Schema Drift Detected
      </Heading>
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Change Type</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Column</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Details</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {drift.schema_diff.map((diff, index) => (
            <Table.Row key={index}>
              <Table.Cell>
                <Badge color={getBadgeColor(diff.type)}>{formatChangeType(diff.type)}</Badge>
              </Table.Cell>
              <Table.Cell>{'column_name' in diff ? diff.column_name : '-'}</Table.Cell>
              <Table.Cell>
                {diff.type === 'column_changed_type' ? (
                  <Text>
                    {diff.old_type} &rarr; {diff.new_type}
                  </Text>
                ) : (
                  '-'
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Callout.Root color="red" mb="2">
        <Callout.Icon>
          <ExclamationTriangleIcon />
        </Callout.Icon>
        <Callout.Text>
          {hasTableDeleted
            ? 'This table appears to be no longer available. Please create a new participant type.'
            : 'Edit and save the participant type to correct or persist the proposed fields below.'}
        </Callout.Text>
      </Callout.Root>
    </Flex>
  );
}

function getBadgeColor(type: TableDiff['type']) {
  switch (type) {
    case 'column_deleted':
    case 'table_deleted':
      return 'red';
    case 'column_changed_type':
      return 'orange';
    default:
      return 'gray';
  }
}

function formatChangeType(type: TableDiff['type']) {
  switch (type) {
    case 'column_deleted':
      return 'Column Deleted';
    case 'table_deleted':
      return 'Table Deleted';
    case 'column_changed_type':
      return 'Type Changed';
    default:
      return type;
  }
}
