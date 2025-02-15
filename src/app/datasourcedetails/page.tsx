"use client";
import {Callout, Code, Flex, Heading, Spinner, Table, Text} from "@radix-ui/themes";
import {ApiKeysSection} from "./ApiKeysSection";
import {DeleteParticipantTypeDialog} from "./DeleteParticipantTypeDialog";
import {useAuth} from "@/app/auth-provider";
import {useGetDatasource, useInspectDatasource, useListParticipantTypes,} from "@/api/admin";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {AddParticipantTypeDialog} from "@/app/datasourcedetails/AddParticipantTypeDialog";
import {UpdateDatasourceDialog} from "@/app/datasourcedetails/UpdateDatasourceDialog";
import {InfoCircledIcon} from "@radix-ui/react-icons";
import {isSuccessResponse} from "@/services/typehelper";

function ParticipantTypesTable({datasourceId}: { datasourceId: string }) {
    const {data, isLoading, error} = useListParticipantTypes(
        datasourceId
    );

    if (isLoading) return <Spinner/>;
    if (error || !isSuccessResponse(data)) return <Text>Error loading participant types: {JSON.stringify(error)}</Text>;

    return (
        <Table.Root variant="surface">
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeaderCell>Participant Type</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Table Name</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {data.data.items?.map((item) => (
                    <Table.Row key={item.participant_type}>
                        <Table.Cell>
                            <Link
                                href={`/participanttypedetails?datasource_id=${datasourceId}&participant_type=${item.participant_type}`}>
                                {item.participant_type}
                            </Link>
                        </Table.Cell>
                        <Table.Cell>{item.table_name}</Table.Cell>
                        <Table.Cell>
                            <DeleteParticipantTypeDialog
                                datasourceId={datasourceId}
                                participantType={item.participant_type}
                            />
                        </Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table.Root>
    );
}

export default function Page() {
    const searchParams = useSearchParams();
    const datasourceId = searchParams.get('id');
    const {idToken} = useAuth();

    const {
        data: datasourceDetails,
        isLoading: datasourceDetailsLoading,
    } = useGetDatasource(datasourceId!, {
        swr: {
            enabled: datasourceId !== null && idToken !== null,
        }
    });

    const {
        data,
        isLoading: inspectDatasourceLoading,
    } = useInspectDatasource(datasourceId!, {
        swr: {
            enabled: datasourceId !== null && idToken !== null,
        }
    });

    const isLoading = inspectDatasourceLoading || datasourceDetailsLoading;

    if (isLoading || idToken === null) {
        return <Spinner/>
    }
    if (data === undefined || !isSuccessResponse(data) || !isSuccessResponse(datasourceDetails) || datasourceId === null) {
        return <Text>Error</Text>;
    }

    const datasourceName = datasourceDetails.data.name;
    const organizationName = datasourceDetails.data.organization_name;
    const organizationId = datasourceDetails.data.organization_id;
    return (
        <Flex direction="column" gap="3">
            <Heading>Datasource Details: {datasourceName}</Heading>
            <Text>Back to organization <Link
                href={`/organizationdetails?id=${organizationId}`}>{organizationName}</Link></Text>
            {data.status !== 200 ? <Callout.Root color={"red"}>
                    <Callout.Icon>
                        <InfoCircledIcon/>
                    </Callout.Icon>
                    <Callout.Text>
                        Failed to connect to datasource: <Code>{JSON.stringify(data.data)}</Code>
                    </Callout.Text>
                </Callout.Root> :
                <Callout.Root color={"green"}>
                    <Callout.Icon>
                        <InfoCircledIcon/>
                    </Callout.Icon>
                    <Callout.Text>
                        Successfully connected to datasource ({data.data.tables.length} tables)
                    </Callout.Text>
                </Callout.Root>
            }
            <UpdateDatasourceDialog datasourceId={datasourceId} currentName={datasourceName || ''}/>

            <Flex justify="between" align="center">
                <Heading size="4">Participant Types</Heading>
                <AddParticipantTypeDialog datasourceId={datasourceId}/>
            </Flex>
            <ParticipantTypesTable datasourceId={datasourceId}/>
            <ApiKeysSection datasourceId={datasourceId}/>
        </Flex>
    );
}
