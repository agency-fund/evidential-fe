import { DataType, FilterInput, FilterValueTypes } from '@/api/methods.schemas';
import { formatDateUtcYYYYMMDD } from '@/services/date-utils';

export const BETWEEN_BASED_OPS = new Set(['gte', 'lte', 'between', 'after', 'before']);

// For between-based operators, the value array has length 3 when NULL is included:
// [lowerBound, upperBound, null]
export const BETWEEN_WITH_NULL_LENGTH = 3;

export type SingleTypeArray<T> = Array<T | null>;
export type TypedFilter<T> = FilterInput & { value: SingleTypeArray<T> };

// Get default filter configuration for a given field type
export function getDefaultFilterForType(fieldName: string, dataType: DataType): FilterInput {
  switch (dataType) {
    case 'boolean':
      return {
        field_name: fieldName,
        relation: 'includes',
        value: [true],
      };

    case 'integer':
    case 'bigint':
      return {
        field_name: fieldName,
        relation: 'includes',
        value: [0], // Ensure this is a number, not a string
      };

    case 'double precision':
    case 'numeric':
      return {
        field_name: fieldName,
        relation: 'includes',
        value: [0.0], // Ensure this is a number, not a string
      };

    case 'date':
    case 'timestamp without time zone':
      return {
        field_name: fieldName,
        relation: 'includes',
        value: [formatDateUtcYYYYMMDD(new Date())],
      };

    case 'character varying':
    case 'json (unsupported)':
    case 'jsonb (unsupported)':
    case 'timestamp with time zone':
    case 'unsupported':
    case 'uuid':
    default:
      return {
        field_name: fieldName,
        relation: 'includes',
        value: [''],
      };
  }
}

// Convert user-friendly operator to API relation
export function operatorToRelation(operator: string): 'includes' | 'excludes' | 'between' {
  switch (operator) {
    case 'equals':
    case 'on':
    case 'is-true':
    case 'is-false':
    case 'in-list':
      return 'includes';

    case 'not-equals':
    case 'not-in-list':
      return 'excludes';

    case 'gte':
    case 'lte':
    case 'before':
    case 'after':
    case 'between':
      return 'between';

    default:
      return 'includes';
  }
}

// Create a default value array based on operator and data type
export function createDefaultValueForOperator(operator: string, dataType: DataType): FilterValueTypes {
  switch (operator) {
    case 'equals':
    case 'not-equals':
    case 'on':
      if (dataType === 'boolean') return [true];
      if (dataType === 'integer' || dataType === 'bigint') return [0];
      if (dataType === 'double precision' || dataType === 'numeric') return [0.0];
      if (dataType.includes('date') || dataType.includes('timestamp')) {
        return [formatDateUtcYYYYMMDD(new Date())];
      }
      return [''];

    case 'gte':
    case 'after':
      if (dataType === 'integer' || dataType === 'bigint') return [0, null];
      if (dataType === 'double precision' || dataType === 'numeric') return [0.0, null];
      if (dataType.includes('date') || dataType.includes('timestamp')) {
        return [formatDateUtcYYYYMMDD(new Date()), null];
      }
      return ['', null];

    case 'lte':
    case 'before':
      if (dataType === 'integer' || dataType === 'bigint') return [null, 0];
      if (dataType === 'double precision' || dataType === 'numeric') return [null, 0.0];
      if (dataType.includes('date') || dataType.includes('timestamp')) {
        return [null, formatDateUtcYYYYMMDD(new Date())];
      }
      return [null, ''];

    case 'between':
      if (dataType === 'integer' || dataType === 'bigint') return [0, 10];
      if (dataType === 'double precision' || dataType === 'numeric') return [0.0, 10.0];
      if (dataType.includes('date') || dataType.includes('timestamp')) {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        return [formatDateUtcYYYYMMDD(today), formatDateUtcYYYYMMDD(nextWeek)];
      }
      return ['a', 'z'];

    case 'in-list':
    case 'not-in-list':
      if (dataType === 'boolean') return [true];
      if (dataType === 'integer' || dataType === 'bigint') return [0];
      if (dataType === 'double precision' || dataType === 'numeric') return [0.0];
      if (dataType.includes('date') || dataType.includes('timestamp')) {
        return [formatDateUtcYYYYMMDD(new Date())];
      }
      return [''];

    default:
      return [''];
  }
}
