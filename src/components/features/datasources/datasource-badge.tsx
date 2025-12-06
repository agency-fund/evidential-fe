'use client';
import { Badge } from '@radix-ui/themes';
import Link from 'next/link';
import { TableIcon } from '@radix-ui/react-icons';

interface DatasourceBadgeProps {
  datasourceId: string;
  datasourceName: string;
}

export function DatasourceBadge({ datasourceId, datasourceName }: DatasourceBadgeProps) {
  return (
    <Badge variant="soft" color="gray" size="1" asChild>
      <Link href={`/datasources/${datasourceId}`}>
        <TableIcon width="12" height="12" />
        {datasourceName}
      </Link>
    </Badge>
  );
}
