'use client';

import {
  BarChartIcon,
  CalendarIcon,
  CheckCircledIcon,
  ClockIcon,
  IdCardIcon,
  LapTimerIcon,
  TextIcon,
} from '@radix-ui/react-icons';
import { Badge, Flex } from '@radix-ui/themes';
import { DataType } from '@/api/methods.schemas';

const dataTypeConfig: Record<
  DataType,
  { color: 'orange' | 'blue' | 'green' | 'purple' | 'crimson'; icon: React.ReactNode }
> = {
  boolean: { color: 'orange', icon: <CheckCircledIcon /> },
  'character varying': { color: 'blue', icon: <TextIcon /> },
  date: { color: 'green', icon: <CalendarIcon /> },
  integer: { color: 'purple', icon: <BarChartIcon /> },
  'double precision': { color: 'purple', icon: <BarChartIcon /> },
  numeric: { color: 'purple', icon: <BarChartIcon /> },
  'timestamp without time zone': { color: 'crimson', icon: <ClockIcon /> },
  bigint: { color: 'purple', icon: <LapTimerIcon /> },
  uuid: { color: 'purple', icon: <IdCardIcon /> },
};

export function DataTypeBadge({ type }: { type: DataType }) {
  const config = dataTypeConfig[type];
  return (
    <Badge color={config.color}>
      <Flex gap="1" align="center">
        {config.icon}
        {type}
      </Flex>
    </Badge>
  );
}
