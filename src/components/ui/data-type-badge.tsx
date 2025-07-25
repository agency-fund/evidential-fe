'use client';

import {
  BarChartIcon,
  CalendarIcon,
  CheckCircledIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  IdCardIcon,
  LapTimerIcon,
  QuestionMarkCircledIcon,
  TextIcon,
} from '@radix-ui/react-icons';
import { Badge, Flex } from '@radix-ui/themes';
import { DataType } from '@/api/methods.schemas';

const dataTypeConfig: Record<
  DataType,
  { color: 'orange' | 'gold' | 'cyan' | 'green' | 'lime' | 'iris' | 'purple' | 'red'; icon: React.ReactNode }
> = {
  boolean: { color: 'iris', icon: <CheckCircledIcon /> },
  'character varying': { color: 'gold', icon: <TextIcon /> },
  date: { color: 'cyan', icon: <CalendarIcon /> },
  'timestamp without time zone': { color: 'green', icon: <ClockIcon /> },
  'timestamp with time zone': { color: 'lime', icon: <ClockIcon /> },
  integer: { color: 'purple', icon: <BarChartIcon /> },
  'double precision': { color: 'purple', icon: <BarChartIcon /> },
  numeric: { color: 'purple', icon: <BarChartIcon /> },
  bigint: { color: 'purple', icon: <LapTimerIcon /> },
  uuid: { color: 'orange', icon: <IdCardIcon /> },
  'json (unsupported)': { color: 'red', icon: <ExclamationTriangleIcon /> },
  'jsonb (unsupported)': { color: 'red', icon: <ExclamationTriangleIcon /> },
  unsupported: { color: 'red', icon: <QuestionMarkCircledIcon /> },
};

export function DataTypeBadge({ type }: { type: DataType }) {
  const config = dataTypeConfig[type] || dataTypeConfig.unsupported;
  return (
    <Badge color={config.color}>
      <Flex gap="1" align="center">
        {config.icon}
        {type}
      </Flex>
    </Badge>
  );
}
