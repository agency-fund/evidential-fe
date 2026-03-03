'use client';

import { Button, Table } from '@radix-ui/themes';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { SectionCard } from '@/components/ui/cards/section-card';
import { Context } from '@/api/methods.schemas';

interface ContextsSectionProps {
  contexts: Context[];
  onEdit?: () => void;
}

export function ContextsSection({ contexts, onEdit }: ContextsSectionProps) {
  if (contexts.length === 0) {
    return null;
  }

  return (
    <SectionCard
      title="Contexts"
      headerRight={
        onEdit ? (
          <Button size="1" onClick={onEdit}>
            <Pencil2Icon />
            Edit
          </Button>
        ) : undefined
      }
    >
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Value Type</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {contexts.map((context, index) => (
            <Table.Row key={index}>
              <Table.Cell>{context.context_name}</Table.Cell>
              <Table.Cell>{context.context_description || '-'}</Table.Cell>
              <Table.Cell>{context.value_type || '-'}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </SectionCard>
  );
}
