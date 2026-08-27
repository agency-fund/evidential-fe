import { FieldDescriptor } from '@/api/methods.schemas';

/**
 * Returns a new array ordered with the unique ID field first, then alphabetically by field name.
 *
 * The API returns fields sorted by name only, so the unique ID is not otherwise surfaced to the top.
 */
export const sortFieldsForDisplay = (fields: FieldDescriptor[]): FieldDescriptor[] =>
  [...fields].sort((a, b) => {
    if (a.is_unique_id === b.is_unique_id) {
      return a.field_name.localeCompare(b.field_name);
    }
    return a.is_unique_id ? -1 : 1;
  });
