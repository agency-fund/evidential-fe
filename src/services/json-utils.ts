/**
 * JSON utility functions for formatting and serialization
 */

/**
 * Pretty-prints a value as formatted JSON with 2-space indentation
 * @param value - The value to stringify (can be any JSON-serializable value)
 * @returns Pretty-printed JSON string
 */
export function prettyJSON(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
