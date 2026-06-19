'use client';

import { Text } from '@radix-ui/themes';
import { DataType, Filter } from '@/api/methods.schemas';
import { BooleanFilterInput } from '@/components/features/experiments/querybuilder/boolean-filter-input';
import { StringFilterInput } from '@/components/features/experiments/querybuilder/string-filter-input';
import { NumericFilterInput } from '@/components/features/experiments/querybuilder/numeric-filter-input';
import { BigIntFilterInput } from '@/components/features/experiments/querybuilder/bigint-filter-input';
import { DateFilterInput } from '@/components/features/experiments/querybuilder/date-filter-input';
import { TypedFilter } from '@/components/features/experiments/querybuilder/utils';

export interface TypeSpecificFilterProps {
  dataType: DataType;
  filter: Filter;
  onChange: (filter: Filter) => void;
}

export function TypeSpecificFilter({ dataType, filter, onChange }: TypeSpecificFilterProps) {
  switch (dataType) {
    case 'boolean':
      return <BooleanFilter filter={filter as TypedFilter<boolean>} onChange={onChange} />;

    case 'character varying':
    case 'uuid':
      return <StringFilter filter={filter as TypedFilter<string>} onChange={onChange} dataType={dataType} />;

    case 'bigint':
      return <BigIntFilter filter={filter as TypedFilter<string>} onChange={onChange} dataType={dataType} />;

    case 'integer':
    case 'double precision':
    case 'numeric':
      return <NumericFilter filter={filter as TypedFilter<number>} onChange={onChange} dataType={dataType} />;

    case 'date':
    case 'timestamp without time zone':
      return <DateFilter filter={filter as TypedFilter<string>} onChange={onChange} dataType={dataType} />;

    case 'json':
    case 'jsonb':
    case 'timestamp with time zone': // should support this
    case 'unknown':
    default:
      return <Text>Unknown data type: {dataType}</Text>;
  }
}
