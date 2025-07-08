'use client';
import { FieldDescriptor } from '@/api/methods.schemas';
import { Checkbox, Flex, IconButton, Radio, Switch, Table, Text, TextField, Tooltip } from '@radix-ui/themes';
import { useState } from 'react';
import { isEligibleForUseAsMetric } from '@/services/genapi-helpers';
import { TrashIcon } from '@radix-ui/react-icons';

export interface ParticipantFieldsEditorProps {
  fields: FieldDescriptor[];
  onFieldsChange: (fields: FieldDescriptor[]) => void;
  uniqueIdCandidates?: string[];
  allowFieldRemoval?: boolean;
}

export function ParticipantFieldsEditor({
  fields,
  onFieldsChange,
  uniqueIdCandidates = [],
  allowFieldRemoval = false,
}: ParticipantFieldsEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateField = (index: number, field: FieldDescriptor) => {
    const newFields = [...fields];
    newFields[index] = field;
    onFieldsChange(newFields);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    onFieldsChange(newFields);
  };

  const setUniqueIdField = (index: number) => {
    const newFields = fields.map((f, i) => ({
      ...f,
      is_unique_id: i === index,
    }));
    onFieldsChange(newFields);
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
            {showAdvanced && allowFieldRemoval && (
              <Table.ColumnHeaderCell justify="center">Actions</Table.ColumnHeaderCell>
            )}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {fields.map((field, index) => (
            <Table.Row key={`${field.field_name}-${index}`}>
              <Table.Cell>
                {uniqueIdCandidates.includes(field.field_name) ? (
                  <Text weight="bold">{field.field_name}</Text>
                ) : (
                  <Text>{field.field_name}</Text>
                )}
              </Table.Cell>
              <Table.Cell>{field.data_type}</Table.Cell>
              <Table.Cell>
                <TextField.Root
                  value={field.description || ''}
                  onChange={(e) =>
                    updateField(index, {
                      ...field,
                      description: e.target.value,
                    })
                  }
                />
              </Table.Cell>
              <Table.Cell justify={'center'}>
                <Radio
                  value={field.field_name}
                  checked={field.is_unique_id || false}
                  onValueChange={() => setUniqueIdField(index)}
                  size="3"
                />
              </Table.Cell>
              {showAdvanced && (
                <Table.Cell justify={'center'}>
                  <Checkbox
                    checked={field.is_strata || false}
                    onCheckedChange={(checked) =>
                      updateField(index, {
                        ...field,
                        is_strata: checked === true,
                      })
                    }
                    size="3"
                  />
                </Table.Cell>
              )}
              <Table.Cell justify={'center'}>
                <Checkbox
                  checked={field.is_filter || false}
                  onCheckedChange={(checked) =>
                    updateField(index, {
                      ...field,
                      is_filter: checked === true,
                    })
                  }
                  size="3"
                />
              </Table.Cell>
              <Table.Cell justify={'center'}>
                {isEligibleForUseAsMetric(field.data_type) ? (
                  <Checkbox
                    checked={field.is_metric || false}
                    onCheckedChange={(checked) =>
                      updateField(index, {
                        ...field,
                        is_metric: checked === true,
                      })
                    }
                    size="3"
                  />
                ) : (
                  <Tooltip content="Not eligible for use as a metric">
                    <Checkbox disabled={true} size="3" />
                  </Tooltip>
                )}
              </Table.Cell>
              {showAdvanced && allowFieldRemoval && (
                <Table.Cell justify={'center'}>
                  <IconButton
                    onClick={(e) => {
                      e.preventDefault();
                      removeField(index);
                    }}
                    variant="soft"
                    color="red"
                  >
                    <TrashIcon />
                  </IconButton>
                </Table.Cell>
              )}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Flex>
  );
}
