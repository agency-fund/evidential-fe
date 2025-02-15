"use client";
import {Button, Flex, Heading, Spinner, Table, Text, TextField} from "@radix-ui/themes";
import {useAuth} from "@/app/auth-provider";
import {useGetParticipantTypes, useUpdateParticipantType,} from "@/api/admin";
import {useSearchParams} from "next/navigation";
import {useEffect, useState} from "react";
import {FieldDescriptor, ParticipantsDef} from "@/api/methods.schemas";
import {isSuccessResponse} from "@/services/typehelper";

function ParticipantDefEditor({participantDef, onUpdate}: {
    participantDef: ParticipantsDef,
    onUpdate: (updated: ParticipantsDef) => void
}) {
    useEffect(() => {
        const sortedFields = [...participantDef.fields].sort((a, b) => {
            if (a.is_unique_id === b.is_unique_id) {
                return a.field_name.localeCompare(b.field_name);
            }
            return a.is_unique_id ? -1 : 1;
        });

        // Only update if the order has changed
        if (JSON.stringify(sortedFields) !== JSON.stringify(participantDef.fields)) {
            onUpdate({
                ...participantDef,
                fields: sortedFields
            });
        }
    }, [participantDef.fields, participantDef, onUpdate]);

    const updateField = (index: number, field: FieldDescriptor) => {
        const newFields = [...participantDef.fields];
        newFields[index] = field;
        onUpdate({
            ...participantDef,
            fields: newFields
        });
    };

    return (
        <Flex direction="column" gap="3">
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeaderCell>Field Name</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Data Type</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell justify="center">Unique ID</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell justify="center">Strata</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell justify="center">Filter</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell justify="center">Metric</Table.ColumnHeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {participantDef.fields.map((field, index) => (
                        <Table.Row key={index}>
                            <Table.Cell>{field.field_name}</Table.Cell>
                            <Table.Cell>{field.data_type}</Table.Cell>
                            <Table.Cell>
                                <TextField.Root
                                    value={field.description}
                                    onChange={(e) => updateField(index, {
                                        ...field,
                                        description: e.target.value
                                    })}
                                />
                            </Table.Cell>
                            <Table.Cell style={{ textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={field.is_unique_id}
                                    onChange={(e) => updateField(index, {
                                        ...field,
                                        is_unique_id: e.target.checked
                                    })}
                                />
                            </Table.Cell>
                            <Table.Cell style={{ textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={field.is_strata}
                                    onChange={(e) => updateField(index, {
                                        ...field,
                                        is_strata: e.target.checked
                                    })}
                                />
                            </Table.Cell>
                            <Table.Cell style={{ textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={field.is_filter}
                                    onChange={(e) => updateField(index, {
                                        ...field,
                                        is_filter: e.target.checked
                                    })}
                                />
                            </Table.Cell>
                            <Table.Cell style={{ textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={field.is_metric}
                                    onChange={(e) => updateField(index, {
                                        ...field,
                                        is_metric: e.target.checked
                                    })}
                                />
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </Flex>
    );
}

export default function Page() {
    const searchParams = useSearchParams();
    const datasourceId = searchParams.get('datasource_id');
    const participantType = searchParams.get('participant_type');
    const {idToken} = useAuth();
    const [editedDef, setEditedDef] = useState<ParticipantsDef | null>(null);

    const {
        data,
        isLoading,
        error
    } = useGetParticipantTypes(
        datasourceId!,
        participantType!,
        {
            swr: {
                enabled: idToken !== null,
            }
        }
    );

    const {trigger: updateParticipantType} = useUpdateParticipantType(
        datasourceId!,
        participantType!
    );

    if (!datasourceId || !participantType) {
        return <Text>Error: Missing required parameters</Text>;
    }

    if (isLoading || idToken === null) {
        return <Spinner/>;
    }

    if (error || !isSuccessResponse(data)) {
        return <Text>Error: {JSON.stringify(error)}</Text>;
    }

    const participantConfig = data.data;

    if (participantConfig.type === 'sheet') {
        return (
            <Flex direction="column" gap="3">
                <Heading>Participant Type Details: {participantType}</Heading>
                <Text>Sheet Reference Configuration:</Text>
                <pre style={{whiteSpace: 'pre-wrap'}}>
                    {JSON.stringify(participantConfig, null, 2)}
                </pre>
            </Flex>
        );
    }

    const handleSave = async () => {
        if (!editedDef) return;

        await updateParticipantType({
            fields: editedDef.fields
        });
    };

    return (
        <Flex direction="column" gap="3">
            <Flex justify="between" align="center">
                <Heading>Participant Type Details: {participantType}</Heading>
                <Button onClick={handleSave} disabled={!editedDef}>Save Changes</Button>
            </Flex>
            <ParticipantDefEditor
                participantDef={editedDef || participantConfig as ParticipantsDef}
                onUpdate={setEditedDef}
            />
        </Flex>
    );
}
