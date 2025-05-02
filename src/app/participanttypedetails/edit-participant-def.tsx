'use client';
import { FieldDescriptor, ParticipantsDef } from '@/api/methods.schemas';
import { Flex, Switch, Table, Text, TextField, Radio, Checkbox, Tooltip } from '@radix-ui/themes';
import { useState } from 'react';
import { isEligibleForUseAsMetric } from '@/services/genapi-helpers';

export function ParticipantDefEditor({
  participantDef,
  onUpdate,
}: {
  participantDef: ParticipantsDef;
  onUpdate: (updated: ParticipantsDef) => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const updateField = (index: number, field: FieldDescriptor) => {
    const newFields = [...participantDef.fields];
    newFields[index] = field;
    onUpdate({
      ...participantDef,
      fields: newFields,
    });
  };
  return (
    <Flex direction="column" gap="3">
      <Flex align="center" gap="2">
        <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
        <Text size="2">Show Advanced Options</Text>
      </Flex>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Field Name</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Data Type</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell justify="center">Unique ID</Table.ColumnHeaderCell>
            {showAdvanced && <Table.ColumnHeaderCell justify="center">Strata</Table.ColumnHeaderCell>}
            <Table.ColumnHeaderCell justify="center">Filter</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell justify="center">Metric</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {participantDef.fields.map((field, index) => (
            <Table.Row key={index}>
              <Table.Cell>{field.field_name}</Table.Cell>
              <Table.Cell>{field.data_type}</Table.Cell>
              <Table.Cell>
                <TextField.Root
                  value={field.description}
                  onChange={(e) =>
                    updateField(index, {
                      ...field,
                      description: e.target.value,
                    })
                  }
                />
              </Table.Cell>
              <Table.Cell style={{ textAlign: 'center' }}>
                <Radio
                  value={field.field_name}
                  checked={field.is_unique_id}
                  onValueChange={(checked) => {
                    const newFields = [...participantDef.fields].map((f) => ({
                      ...f,
                      is_unique_id: false,
                    }));
                    newFields[index].is_unique_id = true;
                    onUpdate({
                      ...participantDef,
                      fields: newFields,
                    });
                  }}
                  size="3"
                />
              </Table.Cell>
              {showAdvanced && (
                <Table.Cell style={{ textAlign: 'center' }}>
                  <Checkbox
                    checked={field.is_strata}
                    onCheckedChange={(checked) =>
                      updateField(index, {
                        ...field,
                        is_strata: checked,
                      } as FieldDescriptor)
                    }
                    size="3"
                  />
                </Table.Cell>
              )}
              <Table.Cell style={{ textAlign: 'center' }}>
                <Checkbox
                  checked={field.is_filter}
                  onCheckedChange={(checked) =>
                    updateField(index, {
                      ...field,
                      is_filter: checked,
                    } as FieldDescriptor)
                  }
                  size="3"
                />
              </Table.Cell>
              <Table.Cell style={{ textAlign: 'center' }}>
                {isEligibleForUseAsMetric(field.data_type) ? (
                  <Checkbox
                    checked={field.is_metric}
                    onCheckedChange={(checked) =>
                      updateField(index, {
                        ...field,
                        is_metric: checked,
                      } as FieldDescriptor)
                    }
                    size="3"
                  />
                ) : (
                  <Tooltip content="Not eligible for use as a metric">
                    <Checkbox checked={field.is_metric} disabled={true} size="3" />
                  </Tooltip>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Flex>
  );
}
