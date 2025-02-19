"use client";
import { useGetParticipantTypes, useUpdateParticipantType } from "@/api/admin";
import { ParticipantsDef } from "@/api/methods.schemas";
import { ParticipantDefEditor } from "@/app/participanttypedetails/EditParticipantDef";
import { isSuccessResponse } from "@/services/typehelper";
import { Button, Flex, Heading, Spinner, Text } from "@radix-ui/themes";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function Page() {
	const searchParams = useSearchParams();
	const datasourceId = searchParams.get("datasource_id");
	const participantType = searchParams.get("participant_type");
	const [editedDef, setEditedDef] = useState<ParticipantsDef | null>(null);

	const { data, isLoading, error } = useGetParticipantTypes(
		datasourceId!,
		participantType!,
	);

	const { trigger: updateParticipantType } = useUpdateParticipantType(
		datasourceId!,
		participantType!,
	);

	if (!datasourceId || !participantType) {
		return <Text>Error: Missing required parameters</Text>;
	}

	if (isLoading) {
		return <Spinner />;
	}

	if (error || !isSuccessResponse(data)) {
		return <Text>Error: {JSON.stringify(error)}</Text>;
	}

	const participantConfig = data.data;

	// Sort fields only in the initial config, putting unique_id field at top
	if (participantConfig.type !== "sheet") {
		const sortedFields = [...participantConfig.fields].sort((a, b) => {
			if (a.is_unique_id === b.is_unique_id) {
				return a.field_name.localeCompare(b.field_name);
			}
			return a.is_unique_id ? -1 : 1;
		});
		participantConfig.fields = sortedFields;
	}

	if (participantConfig.type === "sheet") {
		return (
			<Flex direction="column" gap="3">
				<Heading>Participant Type Details: {participantType}</Heading>
				<Text>Sheet Reference Configuration:</Text>
				<pre style={{ whiteSpace: "pre-wrap" }}>
					{JSON.stringify(participantConfig, null, 2)}
				</pre>
			</Flex>
		);
	}

	const handleSave = async () => {
		if (!editedDef) return;

		await updateParticipantType({
			fields: editedDef.fields,
		});
	};

	return (
		<Flex direction="column" gap="3">
			<Flex justify="between" align="center">
				<Heading>Participant Type Details: {participantType}</Heading>
				<Button onClick={handleSave} disabled={!editedDef}>
					Save Changes
				</Button>
			</Flex>
			<ParticipantDefEditor
				participantDef={editedDef || (participantConfig as ParticipantsDef)}
				onUpdate={setEditedDef}
			/>
		</Flex>
	);
}
