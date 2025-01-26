"use client";
import {Heading, Spinner, Table, Text} from "@radix-ui/themes";
import {TrashIcon} from "@radix-ui/react-icons";
import {unimplemented} from "@/services/unimplemented";
import useSWR from "swr";
import {Datasource} from "@/services/fetcher";

function DataSourcesTable({dataSources}: {dataSources: Datasource[]}) {
    return <Table.Root variant="surface">
        <Table.Header>
            <Table.Row>
                <Table.ColumnHeaderCell>Datasource ID</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Secured?</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {dataSources.map((item) =>
                <Table.Row key={item.id}>
                    <Table.Cell>{item.id}</Table.Cell>
                    <Table.Cell>{item.type}</Table.Cell>
                    <Table.Cell>{item.secured}</Table.Cell>
                    <Table.Cell><TrashIcon onClick={unimplemented}/></Table.Cell>
                </Table.Row>)}

        </Table.Body>
    </Table.Root>;
}

export default function Page() {
    const {
        data,
        isLoading,
        error
    } = useSWR("m/datasources");
    if (isLoading) {
        return <Spinner/>
    }
    if (error) {
        return <Text>Error: {JSON.stringify(error)}</Text>
    }
    return <>
        <Heading>Manage Datasources</Heading>
        <DataSourcesTable dataSources={data}/>
    </>;
}
