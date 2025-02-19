"use client";
import {
    AlertDialog,
    Button,
    Code,
    DataList,
    Dialog,
    Flex,
    Heading,
    IconButton,
    Spinner,
    Table,
    Text
} from "@radix-ui/themes";
import {CopyIcon, LockOpen2Icon, TrashIcon} from "@radix-ui/react-icons";
import {useState} from "react";
import {getListApiKeysKey, useCreateApiKey, useDeleteApiKey, useListApiKeys} from "@/api/admin";
import {ApiKeySummary} from "@/api/methods.schemas";
import {isSuccessResponse} from "@/services/typehelper";
import {mutate} from "swr";

const CreateApiKeyDialog = ({datasourceId}: { datasourceId: string }) => {
    const [state, setState] = useState<"presenting-form" | "presenting-results" | "presenting-button">("presenting-button");
    const {
        data: createdKey,
        trigger: triggerCreateApiKey,
        isMutating
    } = useCreateApiKey();

    return <>
        {state === "presenting-results" && isSuccessResponse(createdKey) &&
            <Dialog.Root defaultOpen={true}
                         onOpenChange={(open) => setState(open ? "presenting-results" : "presenting-button")}>
                <Dialog.Content>
                    <Dialog.Title>Created API key</Dialog.Title>
                    <Dialog.Description>The API key has been created. It will only be shown once.</Dialog.Description>
                    <Flex direction="column" gap="3">
                        <DataList.Root>
                            <DataList.Item>
                                <DataList.Label minWidth="88px">ID</DataList.Label>
                                <DataList.Value><Code variant="ghost">{createdKey.data.id}</Code></DataList.Value>
                            </DataList.Item>
                            <DataList.Item>
                                <DataList.Label minWidth="88px">Key</DataList.Label>
                                <DataList.Value>
                                    <Flex align="center" gap="2">
                                        <Code variant="ghost">{createdKey.data.key}</Code>
                                        <IconButton
                                            size="1"
                                            aria-label="Copy value"
                                            color="gray"
                                            variant="ghost"
                                        >
                                            <CopyIcon
                                                onClick={() => navigator.clipboard.writeText(createdKey.data.key)}/>
                                        </IconButton>
                                    </Flex>
                                </DataList.Value>
                            </DataList.Item>
                        </DataList.Root>
                    </Flex>
                    <Flex gap="3" mt="4" justify="end">
                        <Dialog.Close>
                            <Button variant="soft" color="gray">
                                Close
                            </Button>
                        </Dialog.Close>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        }

        {(state === "presenting-form" || state == "presenting-button") &&
            <Dialog.Root onOpenChange={(open) => setState(open ? "presenting-form" : "presenting-button")}>
                <Dialog.Trigger>
                    <Button><LockOpen2Icon/> Create API Key</Button>
                </Dialog.Trigger>

                <Dialog.Content>
                    {isMutating ? <Spinner/> :
                        <form onSubmit={async (event) => {
                            event.preventDefault();
                            await triggerCreateApiKey({
                                datasource_id: datasourceId
                            });
                            setState("presenting-results");
                        }}>
                            <Dialog.Title>Create API key</Dialog.Title>
                            <Dialog.Description size="2" mb="4">
                                Create a new API key for this datasource.
                            </Dialog.Description>

                            <Flex gap="3" mt="4" justify="end">
                                <Dialog.Close>
                                    <Button variant="soft" color="gray">
                                        Cancel
                                    </Button>
                                </Dialog.Close>
                                <Button type="submit">Create</Button>
                            </Flex>
                        </form>
                    }
                </Dialog.Content>
            </Dialog.Root>
        }</>;
}

function ApiKeysTable({apiKeys}: { apiKeys: ApiKeySummary[] }) {
    const [confirmingDeleteForKeyId, setConfirmingDeleteForKeyId] = useState<string | null>(null);
    const {trigger} = useDeleteApiKey(confirmingDeleteForKeyId ?? "", );

    return <Flex direction="column" gap="3">
        <AlertDialog.Root open={confirmingDeleteForKeyId !== null}
                          onOpenChange={() => setConfirmingDeleteForKeyId(null)}>
            <AlertDialog.Content>
                <AlertDialog.Title>Delete API key: {confirmingDeleteForKeyId}</AlertDialog.Title>
                <AlertDialog.Description size="2">
                    Are you sure? This API key will no longer be usable.
                </AlertDialog.Description>
                <form
                    onSubmit={(event) => {
                        setConfirmingDeleteForKeyId(null);
                        event.preventDefault();
                    }}
                >
                    <Flex gap="3" mt="4" justify="end">
                        <AlertDialog.Cancel>
                            <Button variant="soft" color="gray">
                                Cancel
                            </Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action onClick={(event) => event.preventDefault()}>
                            <Button variant="solid" color="red" onClick={async () => {
                                if (confirmingDeleteForKeyId === null) {
                                    throw Error("invalid state");
                                }
                                await trigger();
                                await mutate(getListApiKeysKey());
                                return setConfirmingDeleteForKeyId(null);
                            }}>
                                Revoke access
                            </Button>
                        </AlertDialog.Action>
                    </Flex>
                </form>
            </AlertDialog.Content>
        </AlertDialog.Root>
        <Table.Root variant="surface">
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeaderCell>Key ID</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {apiKeys.map((item) => {
                    return <Table.Row key={item.id}>
                        <Table.Cell>{item.id}</Table.Cell>
                        <Table.Cell>
                            <IconButton color="red" variant="soft" onClick={() => setConfirmingDeleteForKeyId(item.id)}>
                                <TrashIcon/>
                            </IconButton>
                        </Table.Cell>
                    </Table.Row>
                })}
            </Table.Body>
        </Table.Root>
    </Flex>;
}

export const ApiKeysSection = ({datasourceId}: { datasourceId: string }) => {
    const {
        data: apiKeys,
        isLoading,
        error
    } = useListApiKeys();

    if (isLoading) {
        return <Spinner/>;
    }

    if (error || !isSuccessResponse(apiKeys)) {
        return <Text>Error loading API keys: {JSON.stringify(error)}</Text>;
    }

    const filteredApiKeys = apiKeys.data.items.filter(key => key.datasource_id === datasourceId);

    return (
        <Flex direction="column" gap="3">
            <Flex justify="between" align="center">
                <Heading size="4">API Keys</Heading>
                <CreateApiKeyDialog datasourceId={datasourceId}/>
            </Flex>
            <ApiKeysTable apiKeys={filteredApiKeys}/>
        </Flex>
    );
};
