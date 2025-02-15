"use client";
import {Flex, Heading, Spinner, Table, Text} from "@radix-ui/themes";
import {useAuth} from "@/app/auth-provider";
import {useGetOrganization} from "@/api/admin";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {DeleteUserDialog} from "@/app/organizationdetails/DeleteUserDialog";
import {DeleteDatasourceDialog} from "@/app/organizationdetails/DeleteDatasourceDialog";
import {AddUserDialog} from "@/app/organizationdetails/AddUserDialog";
import {AddDatasourceDialog} from "@/app/organizationdetails/AddDatasourceDialog";
import {isSuccessResponse} from "@/services/typehelper";

function UsersTable({users, organizationId}: { users: { id: string, email: string }[], organizationId: string }) {
    return (
        <Table.Root variant="surface">
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>User ID</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {users.map((user) => (
                    <Table.Row key={user.id}>
                        <Table.Cell>{user.email}</Table.Cell>
                        <Table.Cell>{user.id}</Table.Cell>
                        <Table.Cell>
                            <Flex gap="2">
                                <DeleteUserDialog organizationId={organizationId} userId={user.id}/>
                            </Flex>
                        </Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table.Root>
    );
}

function DatasourcesTable({datasources, organizationId}: {
    datasources: {
        id: string,
        name: string,
        driver: string,
        type: string
    }[],
    organizationId: string,
}) {
    return (
        <Table.Root variant="surface">
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Datasource ID</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Driver</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {datasources.map((datasource) => (
                    <Table.Row key={datasource.id}>
                        <Table.Cell>
                            <Link href={`/datasourcedetails?id=${datasource.id}`}>
                                {datasource.name}
                            </Link>
                        </Table.Cell>
                        <Table.Cell>{datasource.id}</Table.Cell>
                        <Table.Cell>{datasource.driver}</Table.Cell>
                        <Table.Cell>{datasource.type}</Table.Cell>
                        <Table.Cell>
                            <Flex gap="2">
                                <DeleteDatasourceDialog organizationId={organizationId} datasourceId={datasource.id}/>
                            </Flex>
                        </Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table.Root>
    );
}

export default function Page() {
    const searchParams = useSearchParams();
    const organizationId = searchParams.get('id');
    const {idToken} = useAuth();

    const {
        data,
        isLoading,
        error
    } = useGetOrganization(
        organizationId!,
        {
            swr: {
                enabled: idToken !== null && organizationId !== null,
            }
        }
    );

    if (!organizationId) {
        return <Text>Error: Missing organization ID</Text>;
    }

    if (isLoading || idToken === null) {
        return <Spinner/>;
    }

    if (error || !isSuccessResponse(data)) {
        return <Text>Error: {JSON.stringify(error)}</Text>;
    }

    const organization = data?.data;

    return (
        <Flex direction="column" gap="3">
            <Heading>Organization Details: {organization.name}</Heading>

            <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                    <Heading size="4">Users</Heading>
                    <AddUserDialog organizationId={organizationId}/>
                </Flex>
                <UsersTable users={organization.users} organizationId={organizationId}/>
            </Flex>

            <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                    <Heading size="4">Datasources</Heading>
                    <AddDatasourceDialog organizationId={organizationId}/>
                </Flex>
                <DatasourcesTable datasources={organization.datasources} organizationId={organizationId}/>
            </Flex>
        </Flex>
    );
}
