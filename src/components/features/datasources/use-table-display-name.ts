'use client';

import { useGetDatasource, useInspectTableInDatasource } from '@/api/admin';
import { useAuth } from '@/providers/auth-provider';

export function useTableDisplayName(datasourceId: string, tableName: string | undefined) {
  const auth = useAuth();
  const isPrivileged = auth.isAuthenticated && auth.isPrivileged;
  const { data: datasource, error: datasourceError } = useGetDatasource(datasourceId, {
    swr: { enabled: !!datasourceId && !!tableName },
  });
  const isSheets = datasource?.dsn.type === 'google_sheets';
  const { data: tableMetadata, error: tableError } = useInspectTableInDatasource(
    datasourceId,
    tableName ?? '',
    undefined,
    { swr: { enabled: isPrivileged && isSheets && !!tableName } },
  );

  if (!tableName) return { displayName: undefined, isLoading: false };
  if (!datasource) {
    return {
      displayName: datasourceError ? 'Source name unavailable' : undefined,
      isLoading: !datasourceError,
    };
  }
  if (!isSheets) return { displayName: tableName, isLoading: false };
  if (!isPrivileged) return { displayName: undefined, isLoading: false };
  if (!tableMetadata) {
    return {
      displayName: tableError ? 'Spreadsheet name unavailable' : undefined,
      isLoading: !tableError,
    };
  }
  return { displayName: tableMetadata.display_name || 'Spreadsheet name unavailable', isLoading: false };
}
