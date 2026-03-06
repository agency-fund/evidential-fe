'use client';

import { Badge } from '@radix-ui/themes';
import { TableIcon } from '@radix-ui/react-icons';

interface TableNameBadgeProps {
  tableName: string;
}

export const TableNameBadge = ({ tableName }: TableNameBadgeProps) => (
  <Badge variant="soft" color="blue" size="1" style={{ cursor: 'default' }}>
    <TableIcon width="12" height="12" />
    {tableName}
  </Badge>
);
