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
	const metrics: ExperimentConfirmationDisplayProps["metrics"] = {
		primary: data.primaryMetric
			? {
					field_name: data.primaryMetric.metric.field_name,
					data_type: data.primaryMetric.metric.data_type,
					mde: data.primaryMetric.mde,
				}
			: undefined,
		secondary: (data.secondaryMetrics ?? []).map((m) => ({
			field_name: m.metric.field_name,
			data_type: m.metric.data_type,
			mde: m.mde,
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
