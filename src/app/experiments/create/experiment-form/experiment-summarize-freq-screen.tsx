"use client";

import {
	ExperimentFormData,
	ExperimentScreenId,
} from "@/app/experiments/create/experiment-form/experiment-form-def";
import { ExperimentsSummarizeScreenBase } from "@/app/experiments/create/experiment-form/experiment-summarize-screen-base";
import { ExperimentConfirmationDisplayProps } from "@/components/features/experiments/experiment-confirmation-display";
import { ErrorType } from "@/services/orval-fetch";
import { ScreenProps } from "@/services/wizard/wizard-types";

type ExperimentsSummarizeFreqScreenMessage = {
	type: "set-commit-error";
	response: ErrorType<unknown>;
};

export const ExperimentsSummarizeFreqScreen = ({
	data,
	navigatePrev,
	navigateTo,
	dispatch,
}: ScreenProps<
	ExperimentFormData,
	ExperimentsSummarizeFreqScreenMessage,
	ExperimentScreenId
>) => {
	const isFreqPreassigned =
		data.experimentType === "freq_preassigned" ||
		data.experimentType === "freq_cluster_preassigned";
	const isClusterExperiment =
		data.experimentType === "freq_cluster_preassigned";
	// Look up the achievable MDE for a metric from the MDE-mode power-check
	// response. Returns null when the user picked the recommended sample size
	// (no achievable response was computed) or when the BE didn't return a
	// pct_change_possible — in which case the target MDE is the right thing
	// to show alone.
	const achievableFor = (fieldName: string): number | null => {
		const analyses = data.achievablePowerCheckResponse?.analyses ?? [];
		const match = analyses.find(
			(a) => a.metric_spec.field_name === fieldName,
		);
		const pct = match?.pct_change_possible;
		if (pct == null || !Number.isFinite(pct)) return null;
		return pct * 100;
	};
	const metrics: ExperimentConfirmationDisplayProps["metrics"] = {
		primary: data.primaryMetric
			? {
					field_name: data.primaryMetric.metric.field_name,
					data_type: data.primaryMetric.metric.data_type,
					mde: data.primaryMetric.mde,
					achievable: achievableFor(data.primaryMetric.metric.field_name),
				}
			: undefined,
		secondary: (data.secondaryMetrics ?? []).map((m) => ({
			field_name: m.metric.field_name,
			data_type: m.metric.data_type,
			mde: m.mde,
			achievable: achievableFor(m.metric.field_name),
		})),
	};
	const cluster = isClusterExperiment && data.clusterField
		? {
				field_name: data.clusterField.field_name,
				icc: data.clusterIcc ?? "",
				cv: data.clusterCv ?? "",
				avg_cluster_size: data.clusterAvgSize ?? "",
			}
		: undefined;

	return (
		<ExperimentsSummarizeScreenBase
			data={data}
			navigatePrev={navigatePrev}
			navigateTo={navigateTo}
			onCommitError={(response) =>
				dispatch({ type: "set-commit-error", response })
			}
			infoCalloutText={
				isFreqPreassigned
					? "Assignments will be downloadable after the experiment is saved."
					: "For online A/B testing, assignments are generated on the fly as users enter the experiment. No power analysis or sample size planning is required."
			}
			editTargets={{
				metadata: "metadata",
				treatmentArms: "describe-arms",
				datasource: "freq-select-datasource",
				filters: "freq-stack",
				metrics: "freq-stack",
				powerBalance: "freq-stack",
			}}
			frequentistInfo={{ metrics, desiredN: data.desiredN, cluster }}
		/>
	);
};
