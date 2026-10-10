'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Badge, Button, Card, Flex, Text } from '@radix-ui/themes';
import { ExternalLinkIcon, PlayIcon, ReloadIcon, StopIcon } from '@radix-ui/react-icons';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { DownloadAssignmentsCsvButton } from '@/components/features/experiments/download-assignments-csv-button';
import { GoogleSheetsExperimentDialog } from '@/components/features/experiments/google-sheets-experiment-dialog';

const DEMO_DURATION_MS = 15 * 60 * 1000;
const POLL_INTERVAL_MS = 10 * 1000;

function SheetDemoPolling({
  rawSpreadsheetUrl,
  experimentSpreadsheetUrl,
  datasourceId,
  experimentId,
  experimentName,
  onRefresh,
}: {
  rawSpreadsheetUrl: string;
  experimentSpreadsheetUrl: string | null;
  datasourceId: string;
  experimentId: string;
  experimentName: string;
  onRefresh: (signal: AbortSignal) => Promise<void>;
}) {
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const requestInFlight = useRef(false);
  const manualController = useRef<AbortController | null>(null);

  async function refreshAnalysis(signal: AbortSignal) {
    if (!experimentSpreadsheetUrl) return;
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
          <Text size="2">1. Download participants, experiment columns, and assigned arms.</Text>
          <DownloadAssignmentsCsvButton
            datasourceId={datasourceId}
            experimentId={experimentId}
            label="Download Experiment CSV"
          />
        </Flex>
        <Text size="2">
          2. Keep the Raw tab. Use File → Import → Upload → Insert new sheet(s); name the new tab Experiment. Disable
          “Convert text to numbers, dates, and formulas” to preserve IDs.
        </Text>
        <Flex align="center" gap="3" wrap="wrap">
          <Text size="2">3. Connect a separate Experiment tab for outcomes.</Text>
          <GoogleSheetsExperimentDialog
            datasourceId={datasourceId}
            experimentId={experimentId}
            experimentName={experimentName}
            rawSpreadsheetUrl={rawSpreadsheetUrl}
            experimentSpreadsheetUrl={experimentSpreadsheetUrl}
          />
        </Flex>
        {!experimentSpreadsheetUrl && (
          <Text size="2" color="gray">
            Connect an Experiment tab first to refresh outcomes or start the live demo.
          </Text>
        )}
        <Text size="2">
          4. Enter outcomes in the Experiment tab, then Refresh. Blank means missing; zero is a result. Comparisons need
          results in both arms.
        </Text>
        <Flex direction={{ initial: 'column', sm: 'row' }} justify="between" gap="3">
          <Flex align="center" gap="2" wrap="wrap">
            <Button
              type="button"
              size="2"
              variant="soft"
              onClick={handleRefresh}
              loading={isRefreshing}
              disabled={!experimentSpreadsheetUrl}
            >
              <ReloadIcon />
              Refresh
            </Button>
            <Button
              type="button"
              size="2"
              variant="soft"
              disabled={!experimentSpreadsheetUrl || (expiresAt === null && isRefreshing)}
              onClick={() => {
                setError(null);
                setExpiresAt(expiresAt === null ? Date.now() + DEMO_DURATION_MS : null);
              }}
            >
              {expiresAt === null ? <PlayIcon /> : <StopIcon />}
              {expiresAt === null ? 'Start live demo' : 'Stop live demo'}
            </Button>
          </Flex>
          <Flex align="center" gap="2" wrap="wrap">
            <Button asChild size="2" variant="soft">
              <a href={rawSpreadsheetUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon />
                Open Raw tab
              </a>
            </Button>
            {experimentSpreadsheetUrl && (
              <Button asChild size="2" variant="soft">
                <a href={experimentSpreadsheetUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon />
                  Open Experiment tab
                </a>
              </Button>
            )}
          </Flex>
        </Flex>
        <Flex align="center" gap="2" wrap="wrap">
          <Badge color={expiresAt === null ? 'gray' : 'green'}>
            {expiresAt === null ? 'Live demo off' : 'Live demo running'}
          </Badge>
          <Text size="1" color="gray">
            {expiresAt === null
              ? 'Refreshes every 10 seconds for up to 15 minutes.'
              : 'Edit outcomes to update the analysis.'}
          </Text>
          {lastRefreshedAt !== null && (
            <Text size="1" color="gray">
              Last refreshed at {lastRefreshedAt.toLocaleTimeString()}.
            </Text>
          )}
        </Flex>
        <Text size="1" color="gray">
          Each refresh saves a snapshot to the history chart.
        </Text>
        <Text size="1" color="gray">
          Reconnect if you replace or delete the tab. Google’s CSV export may lag behind edits.
        </Text>
        {error != null && <GenericErrorCallout title="Could not refresh sheet outcomes" error={error} />}
      </Flex>
    </Card>
  );
}

export function GoogleSheetsDemoControls({
  datasourceId,
  experimentId,
  experimentName,
  rawSpreadsheetUrl,
  experimentSpreadsheetUrl,
  onRefresh,
}: {
  datasourceId: string;
  experimentId: string;
  experimentName: string;
  rawSpreadsheetUrl: string;
  experimentSpreadsheetUrl: string | null;
  onRefresh: (signal: AbortSignal) => Promise<void>;
}) {
  return (
    <SheetDemoPolling
      key={`${datasourceId}/${experimentId}/${experimentSpreadsheetUrl ?? 'disconnected'}`}
      rawSpreadsheetUrl={rawSpreadsheetUrl}
      experimentSpreadsheetUrl={experimentSpreadsheetUrl}
      datasourceId={datasourceId}
      experimentId={experimentId}
      experimentName={experimentName}
      onRefresh={onRefresh}
    />
  );
}
