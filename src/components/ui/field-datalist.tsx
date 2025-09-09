'use client';

import { Card, DataList } from '@radix-ui/themes';
import { DataType } from '@/api/methods.schemas';
import { DataTypeBadge } from '@/components/ui/data-type-badge';
import { ReactNode } from 'react';


interface FieldDatalistProps {
    field: {
      field_name: string;
      description: string;
      data_type: DataType;
    };
    children?: ReactNode;
    variant?: 'card' | 'content';
  }
  
  export default function FieldDatalist({field, children, variant = 'card'}: FieldDatalistProps){
    const content = (
      <DataList.Root size="2">
        <DataList.Item>
          <DataList.Label width="fit-content">Field Name</DataList.Label>
          <DataList.Value>
          {field.field_name}
          </DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label minWidth="120px">Description</DataList.Label>
          <DataList.Value>{field.description || "N/A"}</DataList.Value>
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

    if (variant === 'content') {
      return content;
    }

    return (
      <Card key={field.field_name}>
        {content}
      </Card>
    );
  }