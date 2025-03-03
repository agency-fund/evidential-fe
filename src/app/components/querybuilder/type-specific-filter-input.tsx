'use client';

import { Text } from '@radix-ui/themes';
import { AudienceSpecFilter, DataType } from '@/api/methods.schemas';
import { BooleanFilterInput } from './boolean-filter-input';
import { StringFilterInput } from './string-filter-input';
import { NumericFilterInput } from './numeric-filter-input';
import { DateFilterInput } from './date-filter-input';

export interface TypeSpecificFilterInputProps {
  dataType: DataType;
  filter: AudienceSpecFilter;
  onChange: (filter: AudienceSpecFilter) => void;
}

export function TypeSpecificFilterInput({ dataType, filter, onChange }: TypeSpecificFilterInputProps) {
  switch (dataType) {
    case 'boolean':
      return <BooleanFilterInput filter={filter} onChange={onChange} />;

    case 'character varying':
    case 'uuid':
      return <StringFilterInput filter={filter} onChange={onChange} dataType={dataType} />;

    case 'integer':
    case 'bigint':
    case 'double precision':
    case 'numeric':
      return <NumericFilterInput filter={filter} onChange={onChange} dataType={dataType} />;

    case 'date':
    case 'timestamp without time zone':
      return <DateFilterInput filter={filter} onChange={onChange} dataType={dataType} />;

    default:
      return <Text>Unsupported data type: {dataType}</Text>;
  }
}
