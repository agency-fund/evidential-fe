"use client";

import { isClusterDesign } from "@/components/features/experiments/cluster-detection";
import { DownloadAssignmentsCsvButton } from "@/components/features/experiments/download-assignments-csv-button";
import { ExperimentImpactBadge } from "@/components/features/experiments/experiment-impact-badge";
import { ExperimentStatusBadge } from "@/components/features/experiments/experiment-status-badge";
import { ExperimentTypeBadge } from "@/components/features/experiments/experiment-type-badge";
import { ExperimentWithStatus } from "@/components/features/experiments/types";
import { formatIsoDateLocal } from "@/services/date-utils";
import { FileTextIcon } from "@radix-ui/react-icons";
import { Flex, IconButton, Table, Text, Tooltip } from "@radix-ui/themes";
import Link from "next/link";

interface ExperimentTableRowProps {
	experiment: ExperimentWithStatus;
}

export function ExperimentsTableRow({ experiment }: ExperimentTableRowProps) {
	const {
		experiment_id: experimentId,
		datasource_id: datasourceId,
		design_spec,
	} = experiment;
	return (
		<>
			<Table.Row>
				<Table.Cell>
					<Flex width="200px">
						<Tooltip content={design_spec.experiment_name}>
							<Text truncate asChild>
								<Link
									href={`/datasources/${datasourceId}/experiments/${experimentId}`}
								>
									{design_spec.experiment_name}
								</Link>
							</Text>
						</Tooltip>
					</Flex>
				</Table.Cell>
				<Table.Cell>
					<ExperimentStatusBadge status={experiment.status} />
				</Table.Cell>
				<Table.Cell>{formatIsoDateLocal(design_spec.start_date)}</Table.Cell>
				<Table.Cell>{formatIsoDateLocal(design_spec.end_date)}</Table.Cell>
				<Table.Cell>
					<ExperimentImpactBadge
						impact={experiment.impact}
						useShortLabel={true}
					/>
				</Table.Cell>
				<Table.Cell>
					<Flex width="150px">
						<Text truncate color={experiment.decision ? undefined : "gray"}>
							{experiment.decision || "Undecided"}
						</Text>
					</Flex>
				</Table.Cell>
				<Table.Cell>
					<ExperimentTypeBadge
						type={design_spec.experiment_type}
						isCluster={isClusterDesign(
							design_spec,
							(experiment as { power_analyses?: unknown }).power_analyses,
						)}
					/>
				</Table.Cell>
				<Table.Cell>
					<Flex gap="2">
						<DownloadAssignmentsCsvButton
							datasourceId={datasourceId}
							experimentId={experimentId}
						/>
						{design_spec.design_url && (
							<Tooltip content="View design document">
								<IconButton variant="soft" color="blue" size="2" asChild>
									<Link
										href={design_spec.design_url}
										target="_blank"
										rel="noopener noreferrer"
									>
										<FileTextIcon width="16" height="16" />
									</Link>
								</IconButton>
							</Tooltip>
						)}
					</Flex>
				</Table.Cell>
			</Table.Row>
		</>
	);
}
