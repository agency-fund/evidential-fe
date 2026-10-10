'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Button, Card, Flex, Link, Text } from '@radix-ui/themes';
import { ReloadIcon } from '@radix-ui/react-icons';
import { useGetDatasource } from '@/api/admin';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { DownloadAssignmentsCsvButton } from '@/components/features/experiments/download-assignments-csv-button';
import { EditDatasourceDialog } from '@/components/features/datasources/edit-datasource-dialog';

const DEMO_DURATION_MS = 15 * 60 * 1000;
const POLL_INTERVAL_MS = 10 * 1000;

function SheetDemoPolling({
  spreadsheetUrl,
  datasourceId,
  experimentId,
  onRefresh,
}: {
  spreadsheetUrl: string;
  datasourceId: string;
  experimentId: string;
  onRefresh: (signal: AbortSignal) => Promise<void>;
}) {
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const requestInFlight = useRef(false);
  const manualController = useRef<AbortController | null>(null);

  async function refreshAnalysis(signal: AbortSignal) {
    // Manual clicks and automatic polls share a single in-flight request.
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setIsRefreshing(true);
    setError(null);
    try {
      await onRefresh(signal);
      if (!signal.aborted) setLastRefreshedAt(new Date());
    } finally {
      requestInFlight.current = false;
      setIsRefreshing(false);
    }
  }

  const refresh = useEffectEvent(refreshAnalysis);

  useEffect(() => () => manualController.current?.abort(), []);

  async function handleRefresh() {
    if (requestInFlight.current) return;
    const controller = new AbortController();
    manualController.current = controller;
    try {
      await refreshAnalysis(AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]));
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setExpiresAt(null);
      }
    } finally {
      manualController.current = null;
    }
  }

  useEffect(() => {
    if (expiresAt === null) return;
    const controller = new AbortController();
    let nextPoll: ReturnType<typeof setTimeout> | undefined;
    const expiry = setTimeout(() => setExpiresAt(null), Math.max(0, expiresAt - Date.now()));

    async function poll() {
      if (controller.signal.aborted || Date.now() >= expiresAt!) return;
      try {
        await refresh(AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]));
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setExpiresAt(null);
        }
        return;
      }
      if (!controller.signal.aborted && Date.now() < expiresAt!) {
        nextPoll = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    void poll();
    return () => {
      controller.abort();
      clearTimeout(nextPoll);
      clearTimeout(expiry);
    };
  }, [expiresAt]);

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Text weight="bold">Google Sheets demo</Text>
        <Flex align="center" gap="3" wrap="wrap">
          <Text size="2">
            1. Download participant IDs, selected metrics, grouping or filter columns, and assigned arms.
          </Text>
          <DownloadAssignmentsCsvButton
            datasourceId={datasourceId}
            experimentId={experimentId}
            label="Download Experiment CSV"
          />
        </Flex>
        <Text size="2">
          2. Keep your original setup tab. Choose File → Import → Upload → Insert new sheet(s), then rename the new tab
          Experiment. Turn off “Convert text to numbers, dates, and formulas” to preserve participant IDs.
        </Text>
        <Flex align="center" gap="3" wrap="wrap">
          <Text size="2">3. Open the Experiment tab, copy its URL, and save it as the Spreadsheet URL here.</Text>
          <EditDatasourceDialog datasourceId={datasourceId} variant="button" buttonLabel="Connect Experiment tab" />
        </Flex>
        <Text size="2">
          4. Fill or edit your selected metric columns in the Experiment tab, then click Refresh to update the arm
          comparison. Blank cells mean results haven’t arrived yet; zero counts as a result. Comparisons need observed
          values in both arms.
        </Text>
        <Flex align="center" gap="3" wrap="wrap">
          <Button type="button" size="2" variant="soft" onClick={handleRefresh} loading={isRefreshing}>
            <ReloadIcon />
            Refresh
          </Button>
          <Button
            type="button"
            size="2"
            variant="soft"
            disabled={expiresAt === null && isRefreshing}
            onClick={() => {
              setError(null);
              setExpiresAt(expiresAt === null ? Date.now() + DEMO_DURATION_MS : null);
            }}
          >
            {expiresAt === null ? 'Start live demo' : 'Stop live demo'}
          </Button>
          <Link href={spreadsheetUrl} target="_blank" rel="noopener noreferrer">
            Open spreadsheet
          </Link>
          <Text size="2" color="gray">
            {expiresAt === null
              ? 'Start the live demo for automatic refreshes every 10 seconds for 15 minutes.'
              : 'Live demo running. Edit outcomes in the sheet to update this analysis.'}
          </Text>
        </Flex>
        {lastRefreshedAt !== null && (
          <Text size="1" color="gray">
            Last refreshed at {lastRefreshedAt.toLocaleTimeString()}.
          </Text>
        )}
        <Text size="1" color="gray">
          Each demo refresh saves a timed snapshot, so the history chart builds as you edit and remains after reloading.
        </Text>
        <Text size="1" color="gray">
          Edit cells after connecting. If you replace or delete the tab, reconnect its current URL. Google’s CSV export
          can take a little longer to reflect edits.
        </Text>
        {error != null && <GenericErrorCallout title="Could not refresh sheet outcomes" error={error} />}
      </Flex>
    </Card>
  );
}

export function GoogleSheetsDemoControls({
  datasourceId,
  experimentId,
  onRefresh,
}: {
  datasourceId: string;
  experimentId: string;
  onRefresh: (signal: AbortSignal) => Promise<void>;
}) {
  const { data } = useGetDatasource(datasourceId);
  if (data?.dsn.type !== 'google_sheets') return null;
  return (
    <SheetDemoPolling
      key={data.dsn.spreadsheet_url}
      spreadsheetUrl={data.dsn.spreadsheet_url}
      datasourceId={datasourceId}
      experimentId={experimentId}
      onRefresh={onRefresh}
    />
  );
}
