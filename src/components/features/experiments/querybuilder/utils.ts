import { DataType, Filter, FilterValueTypes } from '@/api/methods.schemas';
import { formatDateUtcYYYYMMDD } from '@/services/date-utils';

export const BETWEEN_BASED_OPS = new Set(['gte', 'lte', 'between', 'after', 'before']);

// For between-based operators, the value array has length 3 when NULL is included:
// [lowerBound, upperBound, null]
export const BETWEEN_WITH_NULL_LENGTH = 3;

export type SingleTypeArray<T> = Array<T | null>;
export type TypedFilter<T> = Filter & { value: SingleTypeArray<T> };

// How a filter treats participants that are missing a value for the field.
export type MissingValuesOption = 'any' | 'has-value' | 'is-missing';

// Whether a filter's value array carries the "missing" NULL. For between-based operators the
// missing NULL only lives at the third position; positional NULLs at 0/1 are open bounds, not
// missing markers.
function filterIncludesMissing(filter: Filter): boolean {
  if (filter.relation === 'between') {
    return filter.value.length === BETWEEN_WITH_NULL_LENGTH && filter.value[filter.value.length - 1] === null;
  }
  return filter.value.includes(null);
}

// Read the current missing-values option off a filter. NULL means opposite things per relation:
// on `includes`/`between` a present NULL includes missing rows; on `excludes` a present NULL
// excludes them (see the backend query constructors), so the mapping is relation-aware.
export function getMissingValuesOption(filter: Filter): MissingValuesOption {
  if (filter.relation === 'includes' && filter.value.length === 1 && filter.value[0] === null) {
    return 'is-missing';
  }
  const includesMissing = filterIncludesMissing(filter);
  if (filter.relation === 'excludes') {
    return includesMissing ? 'has-value' : 'any';
  }
  return includesMissing ? 'any' : 'has-value';
}

// Apply a missing-values option to a filter, returning a new filter with the NULL added or removed
// so it compiles to the intended SQL regardless of the operator. Callers that also need to restore
// a hidden predicate after leaving 'is-missing' must stash it separately (the value is replaced here).
export function applyMissingValuesOption(filter: Filter, option: MissingValuesOption): Filter {
  if (option === 'is-missing') {
    return { ...filter, relation: 'includes', value: [null] as Filter['value'] };
  }
  const base = filter.relation === 'between' ? filter.value.slice(0, 2) : filter.value.filter((v) => v !== null);
  const hasPredicate = base.some((v) => v !== null);
  if (!hasPredicate) {
    // No value predicate ("No condition"): express presence alone.
    // 'has-value' -> IS NOT NULL; 'any' -> match everyone (no filter).
    return { ...filter, relation: 'excludes', value: (option === 'has-value' ? [null] : []) as Filter['value'] };
  }
  const wantMissing = option === 'any' ? filter.relation !== 'excludes' : filter.relation === 'excludes';
  return { ...filter, value: (wantMissing ? [...base, null] : base) as Filter['value'] };
}

// New filters default to "with a value" (IS NOT NULL). Numeric fields also pre-select the most
// common operator (>= 0) so the frequent case needs no extra clicks, matching the classic UI;
// other types start with no value predicate ("All participants").
export function getDefaultFilterForType(fieldName: string, dataType: DataType): Filter {
  switch (dataType) {
    case 'integer':
    case 'double precision':
    case 'numeric':
      return { field_name: fieldName, relation: 'between', value: [0, null] };
    case 'bigint':
      return { field_name: fieldName, relation: 'between', value: ['0', null] };
    case 'boolean':
    case 'character varying':
    case 'date':
    case 'json':
    case 'jsonb':
    case 'timestamp with time zone':
    case 'timestamp without time zone':
    case 'unknown':
    case 'uuid':
    default:
      return { field_name: fieldName, relation: 'excludes', value: [null] };
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
      if (dataType === 'integer') return [0];
      if (dataType === 'bigint') return ['0'];
      if (dataType === 'double precision' || dataType === 'numeric') return [0.0];
      if (dataType.includes('date') || dataType.includes('timestamp')) {
        return [formatDateUtcYYYYMMDD(new Date())];
      }
      return [''];

    case 'gte':
    case 'after':
      if (dataType === 'integer') return [0, null];
      if (dataType === 'bigint') return ['0', null];
      if (dataType === 'double precision' || dataType === 'numeric') return [0.0, null];
      if (dataType.includes('date') || dataType.includes('timestamp')) {
        return [formatDateUtcYYYYMMDD(new Date()), null];
      }
      return ['', null];

    case 'lte':
    case 'before':
      if (dataType === 'integer') return [null, 0];
      if (dataType === 'bigint') return [null, '0'];
      if (dataType === 'double precision' || dataType === 'numeric') return [null, 0.0];
      if (dataType.includes('date') || dataType.includes('timestamp')) {
        return [null, formatDateUtcYYYYMMDD(new Date())];
      }
      return [null, ''];

    case 'between':
      if (dataType === 'integer') return [0, 10];
      if (dataType === 'bigint') return ['0', '10'];
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
      if (dataType === 'integer') return [0];
      if (dataType === 'bigint') return ['0'];
      if (dataType === 'double precision' || dataType === 'numeric') return [0.0];
      if (dataType.includes('date') || dataType.includes('timestamp')) {
        return [formatDateUtcYYYYMMDD(new Date())];
      }
      return [''];

    default:
      return [''];
  }
}
