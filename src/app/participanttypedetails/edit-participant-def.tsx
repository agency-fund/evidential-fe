'use client';
import { FieldDescriptor, ParticipantsDef } from '@/api/methods.schemas';
import { Flex, Switch, Table, Text, TextField } from '@radix-ui/themes';
import { useState } from 'react';

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
                <input
                  type="radio"
                  name="unique_id"
                  checked={field.is_unique_id}
                  onChange={(e) => {
                    // Update all fields to set is_unique_id to false
                    const newFields = [...participantDef.fields].map((f) => ({
                      ...f,
                      is_unique_id: false,
                    }));
                    // Then set the selected field to true
                    newFields[index].is_unique_id = e.target.checked;
                    onUpdate({
                      ...participantDef,
                      fields: newFields,
                    });
                  }}
                />
              </Table.Cell>
              {showAdvanced && (
                <Table.Cell style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={field.is_strata}
                    onChange={(e) =>
                      updateField(index, {
                        ...field,
                        is_strata: e.target.checked,
                      })
                    }
                  />
                </Table.Cell>
              )}
              <Table.Cell style={{ textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={field.is_filter}
                  onChange={(e) =>
                    updateField(index, {
                      ...field,
                      is_filter: e.target.checked,
                    })
                  }
                />
              </Table.Cell>
              <Table.Cell style={{ textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={field.is_metric}
                  onChange={(e) =>
                    updateField(index, {
                      ...field,
                      is_metric: e.target.checked,
                    })
                  }
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Flex>
  );
}
