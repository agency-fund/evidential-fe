'use client';

import { Card, DataList, HoverCard } from '@radix-ui/themes';
import { DataType } from '@/api/methods.schemas';
import { DataTypeBadge } from '@/components/ui/data-type-badge';
import { ReactNode } from 'react';

interface FieldDataCardProps {
  field: {
    field_name: string;
    description: string;
    data_type: DataType;
  };
  children?: ReactNode;
  trigger?: ReactNode;
}

export default function FieldDataCard({ field, children, trigger }: FieldDataCardProps) {
  const content = (
    <DataList.Root size="2">
      <DataList.Item>
        <DataList.Label width="fit-content">Field Name</DataList.Label>
        <DataList.Value>{field.field_name}</DataList.Value>
      </DataList.Item>
      <DataList.Item>
        <DataList.Label minWidth="120px">Description</DataList.Label>
        <DataList.Value>{field.description || 'N/A'}</DataList.Value>
      </DataList.Item>
      <DataList.Item>
        <DataList.Label minWidth="120px">Data Type</DataList.Label>
        <DataList.Value>
          <DataTypeBadge type={field.data_type} />
        </DataList.Value>
      </DataList.Item>
      {children}
    </DataList.Root>
  );

  if (trigger) {
    return (
      <HoverCard.Root key={field.field_name}>
        <HoverCard.Trigger>{trigger}</HoverCard.Trigger>
        <HoverCard.Content>{content}</HoverCard.Content>
      </HoverCard.Root>
    );
  }

  return <Card key={field.field_name}>{content}</Card>;
}
