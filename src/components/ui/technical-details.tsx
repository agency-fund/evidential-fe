'use client';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { Button, Code, DataList } from '@radix-ui/themes';
import { useState } from 'react';
import { ReportField } from '@/services/error-report';

const DetailsList = ({ fields }: { fields: ReportField[] }) => (
  <DataList.Root size="1" mt="2">
    {fields.map(({ label, value }) => (
      <DataList.Item key={label} align="start">
        <DataList.Label minWidth="160px" color="gray">
          {label}
        </DataList.Label>
        <DataList.Value>
          <Code
            size="1"
            variant="ghost"
            color="gray"
            highContrast
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {value}
          </Code>
        </DataList.Value>
      </DataList.Item>
    ))}
  </DataList.Root>
);

interface TechnicalDetailsProps {
  /** Returns the fields to show. Called only once the section opens, so only on the client, and may read window. */
  details: () => ReportField[];
}

/** A collapsed section for diagnostic detail most users will not need, such as raw responses and request ids. */
export function TechnicalDetails({ details }: TechnicalDetailsProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger asChild>
        <Button variant="ghost" size="1" color="gray">
          {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
          Technical details
        </Button>
      </Collapsible.Trigger>
      <Collapsible.Content>{open ? <DetailsList fields={details()} /> : null}</Collapsible.Content>
    </Collapsible.Root>
  );
}
