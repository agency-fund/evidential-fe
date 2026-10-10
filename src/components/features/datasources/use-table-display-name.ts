'use client';

import { useGetDatasource, useInspectTableInDatasource } from '@/api/admin';

export function useTableDisplayName(datasourceId: string, tableName: string | undefined): string | undefined {
  const { data: datasource, error: datasourceError } = useGetDatasource(datasourceId, {
    swr: { enabled: !!datasourceId && !!tableName },
  });
  const isSheets = datasource?.dsn.type === 'google_sheets';
  const { data: tableMetadata, error: tableError } = useInspectTableInDatasource(
    datasourceId,
    tableName ?? '',
    undefined,
    { swr: { enabled: isSheets && !!tableName } },
  );

  if (!tableName) return undefined;
  if (!datasource) return datasourceError ? 'Source name unavailable' : 'Loading source name…';
  if (!isSheets) return tableName;
  if (!tableMetadata) return tableError ? 'Spreadsheet name unavailable' : 'Loading spreadsheet name…';
  return tableMetadata.display_name || 'Spreadsheet name unavailable';
}
