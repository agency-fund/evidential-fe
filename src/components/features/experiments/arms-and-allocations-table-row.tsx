import { getGetExperimentForUiKey, useUpdateArm } from "@/api/admin";
import { Arm } from "@/api/methods.schemas";
import { EditableTextArea } from "@/components/ui/inputs/editable-text-area";
import { EditableTextField } from "@/components/ui/inputs/editable-text-field";
import { ReadMoreText } from "@/components/ui/read-more-text";
import { PersonIcon } from "@radix-ui/react-icons";
import { Badge, Heading, Table, Text } from "@radix-ui/themes";
import { mutate } from "swr";

interface ArmsAndAllocationsTableRowProps {
	datasourceId: string;
	experimentId: string;
	arm: Arm;
	armSize: number;
	percentage: number;
	/** Cluster count for this arm (cluster-randomized experiments only). */
	numClusters?: number;
	/** Whether the parent table is showing the Clusters column. */
	showClusters?: boolean;
}

export function ArmsAndAllocationsTableRow({
	datasourceId,
	experimentId,
	arm,
	armSize,
	percentage,
	numClusters,
	showClusters,
}: ArmsAndAllocationsTableRowProps) {
	const { trigger: updateArm } = useUpdateArm(
		datasourceId,
		experimentId,
		arm.arm_id!,
		{
			swr: {
				onSuccess: async () => {
					await mutate(getGetExperimentForUiKey(datasourceId, experimentId));
				},
			},
		},
	);

	return (
		<Table.Row>
			<Table.Cell width="20%">
				<EditableTextField
					value={arm.arm_name}
					onSubmit={(value) => updateArm({ name: value })}
					size="1"
				>
					<Heading size="2">{arm.arm_name}</Heading>
				</EditableTextField>
			</Table.Cell>
			<Table.Cell>
				<Badge>
					<PersonIcon />
					<Text>{armSize.toLocaleString()}</Text>
				</Badge>
			</Table.Cell>
			{showClusters && (
				<Table.Cell>
					{numClusters !== undefined ? (
						<Badge color="green">
							<Text>{numClusters.toLocaleString()}</Text>
						</Badge>
					) : (
						<Text color="gray">—</Text>
					)}
				</Table.Cell>
			)}
			<Table.Cell>
				<Badge>
					<Text>{percentage.toFixed(2)}%</Text>
				</Badge>
			</Table.Cell>
			<Table.Cell>
				<EditableTextArea
					value={arm.arm_description || "No description"}
					onSubmit={(value) => updateArm({ description: value })}
					size="1"
				>
					<ReadMoreText text={arm.arm_description || "No description"} />
				</EditableTextArea>
			</Table.Cell>
		</Table.Row>
	);
}
