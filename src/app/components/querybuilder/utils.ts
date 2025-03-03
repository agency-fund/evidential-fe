import { AudienceSpecFilter, DataType, FilterValueTypes } from '@/api/methods.schemas';

// Get default filter configuration for a given field type
export function getDefaultFilterForType(fieldName: string, dataType: DataType): AudienceSpecFilter {
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
        value: [new Date().toISOString().split('T')[0]],
      };

    case 'character varying':
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

    case 'greater-than':
    case 'less-than':
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
        return [new Date().toISOString().split('T')[0]];
      }
      return [''];

    case 'greater-than':
    case 'after':
      if (dataType === 'integer' || dataType === 'bigint') return [0, null];
      if (dataType === 'double precision' || dataType === 'numeric') return [0.0, null];
      if (dataType.includes('date') || dataType.includes('timestamp')) {
        return [new Date().toISOString().split('T')[0], null];
      }
      return ['', null];

    case 'less-than':
    case 'before':
      if (dataType === 'integer' || dataType === 'bigint') return [null, 0];
      if (dataType === 'double precision' || dataType === 'numeric') return [null, 0.0];
      if (dataType.includes('date') || dataType.includes('timestamp')) {
        return [null, new Date().toISOString().split('T')[0]];
      }
      return [null, ''];

    case 'between':
      if (dataType === 'integer' || dataType === 'bigint') return [0, 10];
      if (dataType === 'double precision' || dataType === 'numeric') return [0.0, 10.0];
      if (dataType.includes('date') || dataType.includes('timestamp')) {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        return [today.toISOString().split('T')[0], nextWeek.toISOString().split('T')[0]];
      }
      return ['a', 'z'];

    case 'in-list':
    case 'not-in-list':
      if (dataType === 'boolean') return [true];
      if (dataType === 'integer' || dataType === 'bigint') return [0];
      if (dataType === 'double precision' || dataType === 'numeric') return [0.0];
      if (dataType.includes('date') || dataType.includes('timestamp')) {
        return [new Date().toISOString().split('T')[0]];
      }
      return [''];

    default:
      return [''];
  }
}
