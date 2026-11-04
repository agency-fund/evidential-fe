import { prettyJSON } from '@/services/json-utils';
import { ApiError } from '@/services/orval-fetch';

/** One labeled value shown under Technical details. */
export interface ReportField {
  label: string;
  value: string;
}

const presentFields = (entries: [label: string, value: string | null][]): ReportField[] =>
  entries.flatMap(([label, value]) => (value === null ? [] : [{ label, value }]));

const formatBody = (data: unknown): string | null => {
  if (data === undefined || data === null) {
    return null;
  }
  return typeof data === 'object' ? prettyJSON(data) : String(data);
};

const requestFields = (error: ApiError, pageUrl: string): [string, string | null][] => [
  ['Page', pageUrl],
  ['API request', error.request === null ? null : `${error.request.method} ${error.request.path}`],
];

export const apiErrorDetails = (error: ApiError, pageUrl: string): ReportField[] =>
  presentFields([
    ['HTTP status', String(error.response.status)],
    ...requestFields(error, pageUrl),
    ['Response body', formatBody(error.response.data)],
  ]);

/**
 * Formats an error callout as plain text: its title, the lines of its body, then its technical details. A multi-line
 * value starts on the line after its label.
 */
export const formatErrorReport = (title: string, body: string[], details: ReportField[]): string =>
  [
    title,
    ...body,
    ...details.map(({ label, value }) => (value.includes('\n') ? `${label}:\n${value}` : `${label}: ${value}`)),
  ].join('\n');
