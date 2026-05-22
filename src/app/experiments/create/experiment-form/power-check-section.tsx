'use client';

import { usePowerCheck } from '@/api/admin';
import { PowerResponseOutput } from '@/api/methods.schemas';
import { SectionCard } from '@/components/ui/cards/section-card';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { CheckCircledIcon, CrossCircledIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import {
  Badge,
  Button,
  Callout,
  Card,
  DataList,
  Flex,
  Grid,
  Heading,
  RadioCards,
  Spinner,
  Table,
  Text,
  TextField,
} from '@radix-ui/themes';
import { useEffect, useRef, useState } from 'react';
import { ZodError } from 'zod';
import { ExperimentFormData } from './experiment-form-def';
import { convertToFrequentistDesignSpec } from './experiment-form-helpers';
import { ExperimentFreqStackScreenMessage } from './experiment-freq-stack-screen';

enum PowerCheckOption {
  USE_POWER_CHECK = 'use_power_check',
  USE_ALL_NON_NULL_SAMPLES = 'use_all_non_null_samples',
  ENTER_OWN = 'enter_own',
  NONE = '',
}

interface PowerCheckSectionProps {
  data: ExperimentFormData;
  dispatch: (msg: ExperimentFreqStackScreenMessage) => void;
}

const isPowerCheckButtonEnabled = (isMutating: boolean, data: ExperimentFormData) => {
  const reasons = [];
  if (isMutating) {
    reasons.push('Running power check');
  }
  if (data.primaryKey === undefined) {
    reasons.push('Please select a unique ID field.');
  }
  if (data.primaryMetric === undefined) {
    reasons.push('Please select a primary metric.');
  }
  return { enabled: !reasons.length, reason: reasons.join('\n') };
};

interface PowerCheckButtonProps {
  enabled: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
  loading: boolean;
}

function RunPowerCheckButton({ enabled, onClick, loading }: PowerCheckButtonProps) {
  return (
    <Button disabled={!enabled} onClick={onClick} style={{ minWidth: '25%' }}>
      <Spinner loading={loading}>
        <LightningBoltIcon />
      </Spinner>
      Run Power Check
    </Button>
  );
}

export function PowerCheckSection({ data, dispatch }: PowerCheckSectionProps) {
  const { trigger, isMutating, error } = usePowerCheck(data.datasourceId!);
  const [validationError, setValidationError] = useState<ZodError | null>(null);

  // Derived from the saved power-check response. We deliberately do NOT
  // hold these as useState — that's what caused the "0 participants /
  // undefined samples" bug when navigating away to the Summary screen and
  // hitting Back: the component remounts, useState resets to undefined,
  // but data.powerCheckResponse (form state) persists, so the displays
  // went out of sync with the underlying data. Computing them from the
  // response makes them survive remounts for free.
  const primaryFromSaved = data.powerCheckResponse?.analyses.find(
    (a) => a.metric_spec.field_name === data.primaryMetric?.metric.field_name,
  );
  const powerCheckTarget: number | undefined = primaryFromSaved?.target_n ?? undefined;
  const nonNullSamples: number | undefined = primaryFromSaved?.metric_spec.available_nonnull_n ?? undefined;
  const allSamples: number | undefined = primaryFromSaved?.metric_spec.available_n ?? undefined;

  // selectedSampleOption is the radio's local UI state. We seed it lazily
  // (once, on mount) from data.desiredN compared against the saved
  // target/non-null sizes so the user's previous choice survives
  // navigating away and back. After mount, it's driven by user clicks /
  // handlePowerCheck like before — keeping it as state lets the user
  // click "Custom" without immediately committing a desiredN.
  const [selectedSampleOption, setSelectedSampleOption] = useState<PowerCheckOption>(() => {
    if (!data.powerCheckResponse) return PowerCheckOption.USE_POWER_CHECK;
    const primary = data.powerCheckResponse.analyses.find(
      (a) => a.metric_spec.field_name === data.primaryMetric?.metric.field_name,
    );
    const target = primary?.target_n ?? undefined;
    const nonNull = primary?.metric_spec.available_nonnull_n ?? undefined;
    if (data.desiredN === undefined) return PowerCheckOption.NONE;
    if (data.desiredN === target) return PowerCheckOption.USE_POWER_CHECK;
    if (data.desiredN === nonNull) return PowerCheckOption.USE_ALL_NON_NULL_SAMPLES;
    return PowerCheckOption.ENTER_OWN;
  });

  // Issue #217: cluster experiments show "clusters first, participants underneath".
  const isClusterExperiment = data.experimentType === 'freq_cluster_preassigned';
  // CV > 0.5 triggers a high-variability warning per the issue mockups.
  const cvNum = Number(data.clusterCv ?? '');
  const hasHighVariability =
    isClusterExperiment && data.clusterCv !== undefined && data.clusterCv !== '' && !Number.isNaN(cvNum) && cvNum > 0.5;

  // Issue #217: linked Clusters ↔ Participants inputs on the custom-N option,
  // with a 0.5s debounce that auto-fills the other field. We track each input
  // as a string so the user can type freely; the debounce timer commits the
  // derived sibling value (and the participants value to set-chosen-n) after
  // they stop typing.
  const avgClusterSize = Number(data.clusterAvgSize ?? '');

  // Lazy-init the Custom inputs so a previously-typed value survives
  // navigating away (Summary → Back). We prefer the cached
  // achievableCustomDesiredN because it remembers the user's typed Custom
  // value even after they switched to another radio (Use minimum / Max).
  // If that's not set yet, fall back to data.desiredN — but only when it
  // doesn't match the recommended or max-available value (those belong to
  // the other radios).
  const initialCustomFromState = (() => {
    let customN: number | undefined = data.achievableCustomDesiredN;
    if (customN === undefined) {
      if (data.desiredN === undefined) return { clusters: '', participants: '' };
      const primary = data.powerCheckResponse?.analyses.find(
        (a) => a.metric_spec.field_name === data.primaryMetric?.metric.field_name,
      );
      const target = primary?.target_n ?? undefined;
      const nonNull = primary?.metric_spec.available_nonnull_n ?? undefined;
      if (data.desiredN === target || data.desiredN === nonNull) {
        return { clusters: '', participants: '' };
      }
      customN = data.desiredN;
    }
    const participants = String(customN);
    const clusters =
      Number.isFinite(avgClusterSize) && avgClusterSize > 0 ? String(Math.ceil(customN / avgClusterSize)) : '';
    return { clusters, participants };
  })();

  const [clustersInput, setClustersInput] = useState<string>(initialCustomFromState.clusters);
  const [participantsInput, setParticipantsInput] = useState<string>(initialCustomFromState.participants);
  // Which field the user is actively editing; used to avoid feedback loops
  // when the debounce timer writes the derived value into the other field.
  const editingRef = useRef<'clusters' | 'participants' | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isClusterExperiment) return;
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    const which = editingRef.current;
    if (which === null) return;
    debounceRef.current = setTimeout(() => {
      if (!Number.isFinite(avgClusterSize) || avgClusterSize <= 0) return;
      if (which === 'clusters') {
        const n = Number(clustersInput);
        if (!Number.isFinite(n) || n <= 0) {
          setParticipantsInput('');
          dispatch({ type: 'set-chosen-n', value: undefined });
          return;
        }
        const participants = Math.round(n * avgClusterSize);
        setParticipantsInput(String(participants));
        dispatch({ type: 'set-chosen-n', value: participants });
      } else {
        const n = Number(participantsInput);
        if (!Number.isFinite(n) || n <= 0) {
          setClustersInput('');
          dispatch({ type: 'set-chosen-n', value: undefined });
          return;
        }
        setClustersInput(String(Math.ceil(n / avgClusterSize)));
        dispatch({ type: 'set-chosen-n', value: n });
      }
      editingRef.current = null;
    }, 500);
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clustersInput, participantsInput, avgClusterSize, isClusterExperiment]);

  const { enabled } = isPowerCheckButtonEnabled(isMutating, data); // TODO: present reason field

  // Two cached achievable-MDE recomputes — one for the Max-available radio and
  // one for the value typed into Custom. Each is fetched independently and
  // persists in form state so each card's MDE annotation stays visible even
  // when the user is on a different radio. Use minimum sample required's
  // achievable MDE equals the user's target MDE by construction (no call
  // needed).
  const [isRecomputingMax, setIsRecomputingMax] = useState(false);
  const [isRecomputingCustom, setIsRecomputingCustom] = useState(false);

  // Helper to fire a fresh power-check call with `desired_n` set to `n`,
  // independent of any react state on the parent (so it's safe to call from
  // two different effects with different desired_n values).
  const fetchAchievableFor = async (n: number) => {
    if (!data.tableName || !data.primaryKey || !data.primaryMetric) return undefined;
    try {
      const design_spec = convertToFrequentistDesignSpec({ ...data, desiredN: n });
      return await trigger({ design_spec });
    } catch {
      return undefined;
    }
  };

  // Max-available recompute: fires once nonNullSamples becomes known after
  // the initial Power Check. Doesn't depend on which radio is selected.
  useEffect(() => {
    if (nonNullSamples === undefined || nonNullSamples <= 0) return;
    if (data.achievableMaxPowerCheckResponse !== undefined) return;
    if (!data.tableName || !data.primaryKey || !data.primaryMetric) return;
    let cancelled = false;
    setIsRecomputingMax(true);
    void (async () => {
      const response = await fetchAchievableFor(nonNullSamples);
      if (cancelled) return;
      if (response) dispatch({ type: 'set-achievable-max-response', response });
      setIsRecomputingMax(false);
    })();
    return () => {
      cancelled = true;
      setIsRecomputingMax(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonNullSamples, data.achievableMaxPowerCheckResponse]);

  // Custom recompute: fires when the user is on the Custom option and the
  // typed desired_n differs from the cached one. desiredN itself is already
  // debounced upstream (set-chosen-n only fires after 500ms typing pause).
  useEffect(() => {
    if (selectedSampleOption !== PowerCheckOption.ENTER_OWN) return;
    if (data.desiredN === undefined) return;
    if (data.desiredN === data.achievableCustomDesiredN) return;
    if (data.desiredN === powerCheckTarget) return;
    if (data.desiredN === nonNullSamples) return;
    if (!data.tableName || !data.primaryKey || !data.primaryMetric) return;
    let cancelled = false;
    const targetN = data.desiredN;
    setIsRecomputingCustom(true);
    void (async () => {
      const response = await fetchAchievableFor(targetN);
      if (cancelled) return;
      if (response) {
        dispatch({ type: 'set-achievable-custom-response', response, desiredN: targetN });
      }
      setIsRecomputingCustom(false);
    })();
    return () => {
      cancelled = true;
      setIsRecomputingCustom(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    data.desiredN,
    selectedSampleOption,
    data.achievableCustomDesiredN,
    powerCheckTarget,
    nonNullSamples,
  ]);

  // Helper to pull pct_change for the primary metric from any power-check
  // response. Reads pct_change_with_desired_n first (set by the BE when
  // desired_n was sufficient) and falls back to pct_change_possible (set in
  // the MDE-mode-fallback path when desired_n was insufficient).
  const readAchievablePct = (response: PowerResponseOutput | undefined): number | null => {
    const primary = response?.analyses.find(
      (a) => a.metric_spec.field_name === data.primaryMetric?.metric.field_name,
    );
    if (!primary) return null;
    const withDesired = (primary as { pct_change_with_desired_n?: number | null })
      .pct_change_with_desired_n;
    if (withDesired != null) return withDesired;
    return primary.pct_change_possible ?? null;
  };
  const maxAchievablePct = readAchievablePct(data.achievableMaxPowerCheckResponse);
  const customAchievablePct = readAchievablePct(data.achievableCustomPowerCheckResponse);

  // Target MDE the user requested (string from the form, expressed as a
  // percent). Used as the "achievable MDE" for the recommended option, since
  // by construction the recommended sample size hits the target exactly.
  const targetMdeStr = data.primaryMetric?.mde;
  const targetMdePctNum = targetMdeStr !== undefined && targetMdeStr !== '' ? Number(targetMdeStr) : null;

  /** One-line "Achievable MDE: X%" annotation, sized to fit under a radio card.
   * Blue mirrors how Target MDE is shown on the saved-experiment Analysis bar
   * — same statistical concept, different perspective. Green stays reserved
   * for cluster counts (clusters/participants colorway) to keep that signal
   * unambiguous. Loading stays gray so users can tell "computing" from a real
   * value at a glance. */
  const renderAchievableMdeLine = (
    pctChange: number | null | undefined,
    opts: { loading?: boolean; note?: string } = {},
  ) => {
    if (opts.loading) {
      return (
        <Text size="1" color="gray">
          Achievable MDE: computing…
        </Text>
      );
    }
    if (pctChange == null) return null;
    const pct = (pctChange * 100).toFixed(2);
    return (
      <Text size="1" color="blue">
        Achievable MDE: <strong>{pct}%</strong>
        {opts.note ? ` ${opts.note}` : ''}
      </Text>
    );
  };

  const handlePowerCheck = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setValidationError(null);

    if (!data.tableName || !data.primaryKey || !data.primaryMetric) {
      return;
    }

    // TODO: reimplement this to be simpler
    try {
      const design_spec = convertToFrequentistDesignSpec(data);
      const response = await trigger({ design_spec });
      const primary = response.analyses.find((a) => a.metric_spec.field_name === data.primaryMetric?.metric.field_name);

      dispatch({
        type: 'set-power-check-response',
        response,
        desiredN: undefined,
      });
      // powerCheckTarget / nonNullSamples / allSamples are derived from
      // data.powerCheckResponse now (see top of component), so the dispatch
      // above is enough — no separate setters needed.
      if (primary?.sufficient_n) {
        setSelectedSampleOption(PowerCheckOption.USE_POWER_CHECK);
        dispatch({
          type: 'set-chosen-n',
          value: primary?.target_n ?? undefined,
        });
      } else {
        setSelectedSampleOption(PowerCheckOption.NONE);
      }
    } catch (err) {
      if (err instanceof ZodError) {
        setValidationError(err);
        return;
      }
      throw err;
    }
  };

  const handleSampleOptionChange = (value: PowerCheckOption) => {
    setSelectedSampleOption(value);
    switch (value) {
      case PowerCheckOption.USE_POWER_CHECK:
        dispatch({ type: 'set-chosen-n', value: powerCheckTarget });
        break;
      case PowerCheckOption.USE_ALL_NON_NULL_SAMPLES:
        dispatch({ type: 'set-chosen-n', value: nonNullSamples });
        break;
      case PowerCheckOption.ENTER_OWN:
        // If the user had previously typed a value (cached as
        // achievableCustomDesiredN), restore it so the inputs and desiredN
        // stay in sync and Next is enabled. Otherwise leave desiredN
        // undefined so the user can type fresh.
        dispatch({ type: 'set-chosen-n', value: data.achievableCustomDesiredN });
        break;
      case PowerCheckOption.NONE:
        dispatch({ type: 'set-chosen-n', value: undefined });
        break;
    }
  };

  const primaryPower =
    data.powerCheckResponse !== undefined && !validationError ? data.powerCheckResponse.analyses[0] : undefined;
  const restPower =
    data.powerCheckResponse !== undefined && !validationError && data.powerCheckResponse.analyses.length > 1
      ? data.powerCheckResponse.analyses.slice(1)
      : undefined;

  return (
    <Flex direction="column" gap={'3'}>
      <Flex direction="row" gap="4">
        <Flex direction="column" gap="1" flexGrow="1">
          <Text as="label" size="2" weight="medium">
            Confidence (%)
          </Text>
          <TextField.Root
            type="number"
            min={50}
            max={99}
            value={data.confidence ?? '95'}
            onChange={(e) => dispatch({ type: 'set-confidence', value: e.target.value })}
            placeholder="95"
          />
        </Flex>
        <Flex direction="column" gap="1" flexGrow="1">
          <Text as="label" size="2" weight="medium">
            Power (%)
          </Text>
          <TextField.Root
            type="number"
            min={50}
            max={99}
            value={data.power ?? '80'}
            onChange={(e) => dispatch({ type: 'set-power', value: e.target.value })}
            placeholder="80"
          />
        </Flex>
      </Flex>

      <SectionCard title="Analysis">
        <Flex direction="column" gap="3" align="center">
          <RunPowerCheckButton enabled={enabled} onClick={handlePowerCheck} loading={isMutating} />

          {error && (
            <Flex align="center" gap="2">
              <GenericErrorCallout title={'Power check failed'} error={error} />
            </Flex>
          )}

          {validationError && (
            <Flex align="center" gap="2">
              <GenericErrorCallout
                title={'Validation failed'}
                message={validationError.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n')}
              />
            </Flex>
          )}

          {primaryPower && (
            <Callout.Root color={primaryPower.sufficient_n ? 'green' : 'red'}>
              <Callout.Icon>{primaryPower.sufficient_n ? <CheckCircledIcon /> : <CrossCircledIcon />}</Callout.Icon>
              <Callout.Text>
                {isClusterExperiment && primaryPower.num_clusters_total != null ? (
                  <>
                    There are{' '}
                    <strong>{(primaryPower.metric_spec.available_n ?? 0).toLocaleString()} participants</strong>{' '}
                    available. A minimum of <strong>{primaryPower.num_clusters_total.toLocaleString()} clusters</strong>{' '}
                    ({(primaryPower.target_n ?? 0).toLocaleString()} participants) are needed to meet your design specs.{' '}
                    {primaryPower.sufficient_n ? 'There are enough units available.' : 'Insufficient units available.'}
                  </>
                ) : (
                  primaryPower.msg?.msg ||
                  (primaryPower.sufficient_n
                    ? 'The experiment has sufficient power.'
                    : 'The experiment does not have sufficient power.')
                )}
              </Callout.Text>
              {/* Issue #217: CV > 0.5 warning nested inside the success/result box. */}
              {hasHighVariability && (
                <Callout.Root color="amber" mt="2">
                  <Callout.Text>
                    ⚠ CV = {data.clusterCv}: cluster size variability is high. The cluster count estimate may be
                    unreliable.
                  </Callout.Text>
                </Callout.Root>
              )}
            </Callout.Root>
          )}

          <Grid rows={'1'} columns={restPower ? '2' : '1'} gap={'3'}>
            {primaryPower && (
              <>
                <Card>
                  <Flex direction="column" gap={'3'}>
                    <Heading size={'3'}>Primary Metric: {primaryPower.metric_spec.field_name}</Heading>
                    <DataList.Root>
                      <DataList.Item>
                        <DataList.Label>Status</DataList.Label>
                        <DataList.Value>
                          {primaryPower.sufficient_n ? (
                            <Badge color={'green'}>Pass</Badge>
                          ) : (
                            <Badge color={'red'}>Failed</Badge>
                          )}
                        </DataList.Value>
                      </DataList.Item>
                      <DataList.Item>
                        <DataList.Label>Required</DataList.Label>
                        <DataList.Value>
                          {isClusterExperiment && primaryPower.num_clusters_total != null ? (
                            <Flex direction="column" align="end">
                              <Text color="green" weight="bold">
                                {primaryPower.num_clusters_total.toLocaleString()} clusters
                              </Text>
                              <Text size="1" color="gray">
                                {(primaryPower.target_n ?? 0).toLocaleString()} participants
                              </Text>
                            </Flex>
                          ) : (
                            primaryPower.target_n || '?'
                          )}
                        </DataList.Value>
                      </DataList.Item>
                      <DataList.Item>
                        <DataList.Label>Available</DataList.Label>
                        <DataList.Value>
                          {isClusterExperiment &&
                          data.clusterAvgSize !== '' &&
                          primaryPower.metric_spec.available_n != null ? (
                            <Flex direction="column" align="end">
                              <Text color="green" weight="bold">
                                {Math.floor(
                                  primaryPower.metric_spec.available_n / Number(data.clusterAvgSize),
                                ).toLocaleString()}{' '}
                                clusters
                              </Text>
                              <Text size="1" color="gray">
                                {primaryPower.metric_spec.available_n.toLocaleString()} participants
                              </Text>
                            </Flex>
                          ) : primaryPower.metric_spec.available_n == null ? (
                            '?'
                          ) : primaryPower.metric_spec.available_n === 0 ||
                            primaryPower.metric_spec.available_n < (primaryPower.target_n ?? 0) ? (
                            <Text color="crimson">{primaryPower.metric_spec.available_n}</Text>
                          ) : (
                            primaryPower.metric_spec.available_n
                          )}
                        </DataList.Value>
                      </DataList.Item>
                      <DataList.Item>
                        <DataList.Label>Available (non-null)</DataList.Label>
                        <DataList.Value>
                          {isClusterExperiment &&
                          data.clusterAvgSize !== '' &&
                          primaryPower.metric_spec.available_nonnull_n != null ? (
                            <Flex direction="column" align="end">
                              <Text color="green" weight="bold">
                                {Math.floor(
                                  primaryPower.metric_spec.available_nonnull_n / Number(data.clusterAvgSize),
                                ).toLocaleString()}{' '}
                                clusters
                              </Text>
                              <Text size="1" color="gray">
                                {primaryPower.metric_spec.available_nonnull_n.toLocaleString()} participants
                              </Text>
                            </Flex>
                          ) : primaryPower.metric_spec.available_nonnull_n == null ? (
                            '?'
                          ) : primaryPower.metric_spec.available_nonnull_n === 0 ||
                            primaryPower.metric_spec.available_nonnull_n < (primaryPower.target_n ?? 0) ||
                            primaryPower.metric_spec.available_nonnull_n <
                              (primaryPower.metric_spec.available_n ?? 0) ? (
                            <Text color="orange">{primaryPower.metric_spec.available_nonnull_n}</Text>
                          ) : (
                            primaryPower.metric_spec.available_nonnull_n
                          )}
                        </DataList.Value>
                      </DataList.Item>
                      {primaryPower.pct_change_possible !== null && primaryPower.pct_change_possible !== undefined && (
                        <DataList.Item>
                          <DataList.Label>Target MDE</DataList.Label>
                          <DataList.Value>{(primaryPower.pct_change_possible * 100).toFixed(4)}%</DataList.Value>
                        </DataList.Item>
                      )}
                    </DataList.Root>
                  </Flex>
                </Card>
              </>
            )}
            {restPower ? (
              <Card key={'secondary'}>
                <Flex direction="column" gap={'3'}>
                  <Heading size={'3'}>Secondary Metrics</Heading>
                  <Table.Root>
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeaderCell>Metric</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Required</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Available</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Available (non-null)</Table.ColumnHeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {restPower.map((metricAnalysis, i) => (
                        <Table.Row key={`rest${i}`}>
                          <Table.Cell>{metricAnalysis.metric_spec.field_name}</Table.Cell>
                          <Table.Cell>
                            {metricAnalysis.sufficient_n ? (
                              <Badge color={'green'}>Pass</Badge>
                            ) : (
                              <Badge color={'orange'}>Failed</Badge>
                            )}
                          </Table.Cell>
                          <Table.Cell align={'right'}>{metricAnalysis.target_n ?? ''}</Table.Cell>
                          <Table.Cell align={'right'}>
                            {metricAnalysis.metric_spec.available_n == null ? (
                              '?'
                            ) : metricAnalysis.metric_spec.available_n === 0 ||
                              metricAnalysis.metric_spec.available_n < (metricAnalysis.target_n ?? 0) ? (
                              <Text color="crimson">{metricAnalysis.metric_spec.available_n}</Text>
                            ) : (
                              metricAnalysis.metric_spec.available_n
                            )}
                          </Table.Cell>
                          <Table.Cell align={'right'}>
                            {metricAnalysis.metric_spec.available_nonnull_n == null ? (
                              '?'
                            ) : metricAnalysis.metric_spec.available_nonnull_n === 0 ||
                              metricAnalysis.metric_spec.available_nonnull_n < (metricAnalysis.target_n ?? 0) ? (
                              <Text color="crimson">{metricAnalysis.metric_spec.available_nonnull_n}</Text>
                            ) : (
                              metricAnalysis.metric_spec.available_nonnull_n
                            )}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Flex>
              </Card>
            ) : null}
          </Grid>
        </Flex>
      </SectionCard>

      {data.powerCheckResponse !== undefined && !validationError && (
        <SectionCard title="Select Target Sample Size">
          <Flex direction="column" gap="3" align="start">
            <Text>Select target sample size to distribute across all arms:</Text>
            <Flex direction="column" gap="2" align="center">
              {!data.powerCheckResponse.analyses.map((a) => a.sufficient_n).every((sufficient) => sufficient) && (
                <Callout.Root color="orange">
                  <Callout.Icon>
                    <CrossCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    You don&apos;t have sufficient samples for one or more metrics. You can still proceed with a custom
                    sample size, but consider adjusting your experiment design.
                  </Callout.Text>
                </Callout.Root>
              )}
              <RadioCards.Root columns="1" value={selectedSampleOption} onValueChange={handleSampleOptionChange}>
                <Flex direction={'row'} gap={'3'} justify={'between'}>
                  <RadioCards.Item
                    value={PowerCheckOption.USE_POWER_CHECK}
                    disabled={powerCheckTarget === undefined || powerCheckTarget === 0}
                  >
                    {isClusterExperiment && primaryPower?.num_clusters_total != null ? (
                      <Flex direction="column" align="start">
                        <Text>Use minimum sample required:</Text>
                        <Text color="green" weight="bold">
                          {primaryPower.num_clusters_total.toLocaleString()} clusters
                        </Text>
                        <Text size="1" color="gray">
                          {(powerCheckTarget ?? 0).toLocaleString()} participants
                        </Text>
                        {/* The recommended size is by definition the
													minimum N that achieves the target MDE, so
													achievable MDE = target MDE here. We render the
													same line shape as Max/Custom for consistency. */}
                        {renderAchievableMdeLine(targetMdePctNum != null ? targetMdePctNum / 100 : null, {
                          note: '(matches your Target MDE)',
                        })}
                      </Flex>
                    ) : (
                      <Flex direction="column" align="start">
                        <Text>{`Use minimum sample required: ${powerCheckTarget ?? 'N/A'}`}</Text>
                        {renderAchievableMdeLine(targetMdePctNum != null ? targetMdePctNum / 100 : null, {
                          note: '(matches your Target MDE)',
                        })}
                      </Flex>
                    )}
                  </RadioCards.Item>
                  <RadioCards.Item
                    value={PowerCheckOption.USE_ALL_NON_NULL_SAMPLES}
                    disabled={nonNullSamples === undefined || nonNullSamples === 0}
                  >
                    {isClusterExperiment && data.clusterAvgSize !== '' && nonNullSamples != null ? (
                      <Flex direction="column" align="start">
                        <Text>Use all available non-null:</Text>
                        <Text color="green" weight="bold">
                          {/* Use the BE's clusters total ONLY when this is
														the currently-selected option (otherwise
														achievablePrimary is for a different N, e.g.
														For Max-available the BE response's num_clusters_total
														is the MINIMUM required (not the cluster count for
														desired_n = nonNullSamples), so we always compute it
														client-side from nonNullSamples/avg_cluster_size. */}
                          {Math.floor(nonNullSamples / Number(data.clusterAvgSize)).toLocaleString()} clusters
                        </Text>
                        <Text size="1" color="gray">
                          {nonNullSamples.toLocaleString()} participants
                        </Text>
                        {renderAchievableMdeLine(maxAchievablePct, { loading: isRecomputingMax })}
                      </Flex>
                    ) : (
                      <Flex direction="column" align="start">
                        <Text>{`Use all available non-null samples: ${nonNullSamples}`}</Text>
                        {renderAchievableMdeLine(maxAchievablePct, { loading: isRecomputingMax })}
                      </Flex>
                    )}
                  </RadioCards.Item>
                  <RadioCards.Item
                    value={PowerCheckOption.ENTER_OWN}
                    disabled={allSamples === undefined || allSamples === 0}
                  >
                    <Flex align="start" direction={isClusterExperiment ? 'column' : 'row'} gap="2" wrap="wrap">
                      <span style={{ paddingTop: '4px' }}>Use custom sample size:</span>
                      {isClusterExperiment ? (
                        <div style={{ pointerEvents: 'auto', width: '100%' }}>
                          <Flex direction="column" gap="2">
                            <Flex direction="column" gap="1">
                              <Text size="1" color="gray" style={{ textTransform: 'uppercase' }}>
                                Clusters
                              </Text>
                              <TextField.Root
                                style={{ width: '180px' }}
                                size="2"
                                type="number"
                                min={0}
                                value={clustersInput}
                                placeholder={
                                  primaryPower?.num_clusters_total != null
                                    ? `e.g. ${primaryPower.num_clusters_total}`
                                    : '# clusters'
                                }
                                onChange={(e) => {
                                  editingRef.current = 'clusters';
                                  setClustersInput(e.target.value);
                                }}
                              />
                            </Flex>
                            <Flex direction="column" gap="1">
                              <Text size="1" color="gray" style={{ textTransform: 'uppercase' }}>
                                Participants
                              </Text>
                              <TextField.Root
                                style={{ width: '180px' }}
                                size="2"
                                type="number"
                                max={allSamples ?? undefined}
                                value={participantsInput}
                                placeholder={
                                  primaryPower?.target_n != null
                                    ? `e.g. ${primaryPower.target_n.toLocaleString()}`
                                    : '# participants'
                                }
                                onChange={(e) => {
                                  editingRef.current = 'participants';
                                  setParticipantsInput(e.target.value);
                                }}
                              />
                            </Flex>
                            {renderAchievableMdeLine(customAchievablePct, { loading: isRecomputingCustom })}
                          </Flex>
                        </div>
                      ) : (
                        <div style={{ pointerEvents: 'auto' }}>
                          <TextField.Root
                            style={{ width: '250px' }}
                            size="2"
                            type="number"
                            max={allSamples ?? undefined}
                            onChange={(e) =>
                              dispatch({
                                type: 'set-chosen-n',
                                value: e.target.value === '' ? undefined : Number(e.target.value),
                              })
                            }
                            placeholder="Type your own desired #."
                          />
                          {renderAchievableMdeLine(customAchievablePct, { loading: isRecomputingCustom })}
                        </div>
                      )}
                    </Flex>
                  </RadioCards.Item>
                </Flex>
              </RadioCards.Root>
            </Flex>
          </Flex>
        </SectionCard>
      )}
    </Flex>
  );
}
