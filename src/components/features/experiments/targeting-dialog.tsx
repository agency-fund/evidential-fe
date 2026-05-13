"use client";

import {
	BayesABExperimentSpecOutput,
	CMABExperimentSpecOutput,
	DataType,
	DesignSpecOutput,
	MABExperimentSpecOutput,
	OnlineFrequentistExperimentSpecOutput,
	ParticipantsDef,
	PreassignedFrequentistExperimentSpecOutput,
} from "@/api/methods.schemas";
import { ContextsSection } from "@/components/features/experiments/sections/contexts-section";
import { DatasourceTargetingSection } from "@/components/features/experiments/sections/datasource-targeting-section";
import {
	MetricDisplay,
	MetricsSection,
} from "@/components/features/experiments/sections/metrics-section";
import { OutcomesPriorSection } from "@/components/features/experiments/sections/outcomes-prior-section";
import { WebhooksSection } from "@/components/features/experiments/sections/webhooks-section";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Box, Button, Dialog, Flex } from "@radix-ui/themes";
import { useState } from "react";

interface TargetingDialogProps {
	designSpec: DesignSpecOutput;
	participantType: ParticipantsDef | null | undefined;
	webhookIds: string[];
	/**
	 * Stored power analysis response, used to surface cluster stats that the
	 * BE persists on power_analyses (per-metric icc/cv/avg_cluster_size) but
	 * does not persist on design_spec (issue #217). Optional so non-frequentist
	 * callers don't need to pass it.
	 */
	powerAnalyses?: {
		analyses?: Array<{
			metric_spec?: {
				field_name?: string | null;
				icc?: number | null;
				cv?: number | null;
				avg_cluster_size?: number | null;
			} | null;
			num_clusters_total?: number | null;
			/**
			 * Achievable MDE for the committed sample size, as a fraction (e.g.
			 * 0.078 for 7.8%). Populated when the user picked a non-recommended
			 * N at create time; null otherwise.
			 */
			pct_change_possible?: number | null;
		} | null> | null;
	} | null;
}

const isFrequentistSpec = (
	spec: DesignSpecOutput,
): spec is
	| OnlineFrequentistExperimentSpecOutput
	| PreassignedFrequentistExperimentSpecOutput =>
	spec.experiment_type === "freq_online" ||
	spec.experiment_type === "freq_preassigned";

const isBanditSpec = (
	spec: DesignSpecOutput,
): spec is
	| MABExperimentSpecOutput
	| CMABExperimentSpecOutput
	| BayesABExperimentSpecOutput =>
	spec.experiment_type === "mab_online" ||
	spec.experiment_type === "cmab_online" ||
	spec.experiment_type === "bayes_ab_online";

const isCmabSpec = (spec: DesignSpecOutput): spec is CMABExperimentSpecOutput =>
	spec.experiment_type === "cmab_online";

const toMdePercent = (value: number | null | undefined): string => {
	if (value === null || value === undefined) {
		return "unknown";
	}
	return (value * 100).toFixed(1);
};

export function TargetingDialog({
	designSpec,
	participantType,
	webhookIds,
	powerAnalyses,
}: TargetingDialogProps) {
	const [open, setOpen] = useState(false);

	const fieldTypeByName = new Map(
		(participantType?.fields ?? []).map((field) => {
			return [field.field_name, field.data_type];
		}),
	);

	// Lookup of achievable MDE by metric field_name, sourced from the stored
	// power_analyses. When the experiment was created with a non-recommended
	// sample size, the BE writes pct_change_possible into the saved analysis.
	// For experiments that committed to the recommended size this stays
	// undefined and MdeBadge will render Target MDE alone.
	const achievableByField = new Map<string, number | null>();
	for (const analysis of powerAnalyses?.analyses ?? []) {
		const fieldName = analysis?.metric_spec?.field_name;
		if (!fieldName) continue;
		const pct = analysis?.pct_change_possible;
		if (pct == null || !Number.isFinite(pct)) continue;
		achievableByField.set(fieldName, pct * 100);
	}

	const toMetricDisplay = (
		fieldName: string,
		mdePct: number | null | undefined,
	): MetricDisplay => {
		const dataType = fieldTypeByName.get(fieldName) ?? DataType.unknown;
		return {
			field_name: fieldName,
			data_type: dataType,
			mde: toMdePercent(mdePct),
			achievable: achievableByField.get(fieldName) ?? null,
		};
	};

	let frequentistMetrics:
		| { primary?: MetricDisplay; secondary?: MetricDisplay[] }
		| undefined = undefined;
	if (isFrequentistSpec(designSpec)) {
		const [primaryMetric, ...secondaryMetrics] = designSpec.metrics;
		frequentistMetrics = {
			primary: primaryMetric
				? toMetricDisplay(
						primaryMetric.field_name,
						primaryMetric.metric_pct_change,
					)
				: undefined,
			secondary: secondaryMetrics.map((metric) =>
				toMetricDisplay(metric.field_name, metric.metric_pct_change),
			),
		};
	}

	return (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<Dialog.Trigger>
				<Button variant="ghost" color="blue">
					<MagnifyingGlassIcon /> Targeting
				</Button>
			</Dialog.Trigger>
			<Dialog.Content size="4" width="900px">
				<Flex direction="column" gap="3">
					<Dialog.Title>Targeting and Design</Dialog.Title>
					<Box maxHeight="70vh" overflow="auto" pr="1">
						<Flex direction="column" gap="3">
							{isFrequentistSpec(designSpec) && (
								<>
									<DatasourceTargetingSection
										tableName={designSpec.table_name}
										primaryKey={designSpec.primary_key}
										filters={designSpec.filters}
									/>
									<MetricsSection
										metrics={frequentistMetrics}
										strata={
											designSpec.strata?.map((stratum) => stratum.field_name) ??
											[]
										}
										cluster={(() => {
											// Issue #217: surface cluster fields on the Targeting modal.
											// The BE on PR #163 does NOT persist cluster_column or the
											// per-metric icc/cv/avg_cluster_size onto design_spec — but
											// the per-metric stats ARE preserved inside the stored
											// power_analyses JSON blob. We read from design_spec when
											// present (forward-compat) and otherwise fall back.
											const ds = designSpec as {
												cluster_column?: string | null;
												metrics?: Array<{
													icc?: number | null;
													cv?: number | null;
													avg_cluster_size?: number | null;
												}>;
											};
											const pa = powerAnalyses?.analyses?.[0]?.metric_spec;
											const clusterCol = ds.cluster_column;
											const dsMetric = ds.metrics?.[0];
											const icc = dsMetric?.icc ?? pa?.icc ?? null;
											const cv = dsMetric?.cv ?? pa?.cv ?? null;
											const avg =
												dsMetric?.avg_cluster_size ??
												pa?.avg_cluster_size ??
												null;
											// Show cluster block if we have ANY cluster signal.
											if (!clusterCol && icc == null && cv == null && avg == null) {
												return undefined;
											}
											return {
												// Cluster column name isn't persisted by the BE today
												// (storage_format_converters.py drops it). Show an em
												// dash rather than a confusing parenthetical until the
												// BE storage is fixed.
												field_name: clusterCol ?? "—",
												icc: icc ?? "?",
												cv: cv ?? "?",
												avg_cluster_size: avg ?? "?",
											};
										})()}
									/>
								</>
							)}
							{isBanditSpec(designSpec) && (
								<OutcomesPriorSection
									priorType={designSpec.prior_type}
									rewardType={designSpec.reward_type}
								/>
							)}
							{isCmabSpec(designSpec) && (
								<ContextsSection contexts={designSpec.contexts ?? []} />
							)}
							{webhookIds.length > 0 && (
								<WebhooksSection webhookIds={webhookIds} />
							)}
						</Flex>
					</Box>
					<Flex gap="3" justify="end">
						<Dialog.Close>
							<Button variant="soft" color="gray">
								Close
							</Button>
						</Dialog.Close>
					</Flex>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
}
