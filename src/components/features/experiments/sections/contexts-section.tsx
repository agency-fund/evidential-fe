'use client';

import { Flex, Table, Text } from '@radix-ui/themes';
import { SectionCard } from '@/components/ui/cards/section-card';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { Context } from '@/api/methods.schemas';

interface ContextsSectionProps {
  contexts: Context[];
}

export function ContextsSection({ contexts }: ContextsSectionProps) {
  if (contexts.length === 0) {
    return null;
  }

  return (
    <SectionCard title="Contexts">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Value Type</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {contexts.map((context, index) => (
            <Table.Row key={index}>
              <Table.Cell>
                <Flex gap="2" align="center">
                  <Text>{context.context_id}</Text>
                  {context.context_id && <CopyToClipBoard content={context.context_id} />}
                </Flex>
              </Table.Cell>
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
