'use client';

import { Text } from '@radix-ui/themes';
import { DataType, Filter } from '@/api/methods.schemas';
import { BooleanFilterInput } from '@/components/features/experiments/querybuilder/boolean-filter-input';
import { StringFilterInput } from '@/components/features/experiments/querybuilder/string-filter-input';
import { NumericFilterInput } from '@/components/features/experiments/querybuilder/numeric-filter-input';
import { DateFilterInput } from '@/components/features/experiments/querybuilder/date-filter-input';
import { TypedFilter } from '@/components/features/experiments/querybuilder/utils';

export interface TypeSpecificFilterInputProps {
  dataType: DataType;
  filter: Filter;
  onChange: (filter: Filter) => void;
}

export function TypeSpecificFilterInput({ dataType, filter, onChange }: TypeSpecificFilterInputProps) {
  switch (dataType) {
    case 'boolean':
      return <BooleanFilterInput filter={filter as TypedFilter<boolean>} onChange={onChange} />;

    case 'character varying':
    case 'uuid':
      return <StringFilterInput filter={filter as TypedFilter<string>} onChange={onChange} dataType={dataType} />;

    case 'integer':
    case 'bigint':
    case 'double precision':
    case 'numeric':
      return <NumericFilterInput filter={filter as TypedFilter<number>} onChange={onChange} dataType={dataType} />;

    case 'date':
    case 'timestamp without time zone':
      return <DateFilterInput filter={filter as TypedFilter<string>} onChange={onChange} dataType={dataType} />;

    default:
      return <Text>Unsupported data type: {dataType}</Text>;
  }
}
