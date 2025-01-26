"use client";
import {useAuth} from "@/app/auth-provider";
import useSWR from "swr";
import {
    AlertDialog,
    Badge,
    Button,
    CheckboxGroup,
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
import useSWRMutation from "swr/mutation";
import {deleteApiKeyFetcher, createApiKeyFetcher, ApiKey, Datasource} from "@/services/fetcher";
import {AlertDialogTitle} from "@radix-ui/react-alert-dialog";


const DatasourceBadges = ({datasourceIds}: {datasourceIds:string[]}) => {
    return <Flex gap={"2"}>{datasourceIds.sort().map((item) => <Badge
        key={item}>{item}</Badge>)}</Flex>
}


const CreateApiKeyDialogs = ({dataSources}: {dataSources: Datasource[]}) => {
    const [state, setState] = useState<"presenting-form" | "presenting-results" | "presenting-button">("presenting-button");
    const {idToken} = useAuth();
    const [createButtonDisabled, setCreateButtonDisabled] = useState(true);
    // TODO: make our global fetcher smarter and handle POST with automatically injected token.
    const {data: createdKey, trigger: triggerCreateApiKey, isMutating} = useSWRMutation('m/apikeys', createApiKeyFetcher);

    return <>
        {state === "presenting-results" &&
            <Dialog.Root defaultOpen={true}
                         onOpenChange={(open) => setState(open ? "presenting-results" : "presenting-button")}>
                <Dialog.Content>
                    <Dialog.Title>Created API key</Dialog.Title>
                    <Dialog.Description>The API key has been created. It will only be shown once.</Dialog.Description>
                    <Flex direction="column" gap="3">
                        <DataList.Root>
                            <DataList.Item>
                                <DataList.Label minWidth="88px">ID</DataList.Label>
                                <DataList.Value><Code variant="ghost">{createdKey!.id}</Code></DataList.Value>
                            </DataList.Item>
                            <DataList.Item>
                                <DataList.Label minWidth="88px">Key</DataList.Label>
                                <DataList.Value>
                                    <Flex align="center" gap="2">
                                        <Code variant="ghost">{createdKey!.key}</Code>
                                        <IconButton
                                            size="1"
                                            aria-label="Copy value"
                                            color="gray"
                                            variant="ghost"
                                        >
                                            <CopyIcon onClick={() => navigator.clipboard.writeText(createdKey!.key)}/>
                                        </IconButton>
                                    </Flex>
                                </DataList.Value>
                            </DataList.Item>
                            <DataList.Item>
                                <DataList.Label minWidth="88px">Datasources</DataList.Label>
                                <DataList.Value><Flex gap={"2"}>{createdKey!.datasource_ids.map((item) => <Badge
                                    key={item}>{item}</Badge>)}</Flex></DataList.Value>
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
            <Dialog.Root onOpenChange={(open) => {
                setState(open ? "presenting-form" : "presenting-button");
                setCreateButtonDisabled(open);
            }}>
                <Dialog.Trigger>
                    <Button><LockOpen2Icon/> Create API Key</Button>
                </Dialog.Trigger>

                <Dialog.Content maxWidth="450px">
                    {isMutating ? <Spinner/> :
                        <form onSubmit={async (event) => {
                            // TODO: error checking
                            event.preventDefault();
                            const fd = new FormData(event.currentTarget);
                            const datasource_ids = fd.getAll("datasource_ids").map((s) => String(s));
                            triggerCreateApiKey({
                                token: idToken!,
                                datasource_ids
                            }).then(() => setState("presenting-results"));
                        }}>
                            <Dialog.Title>Create API key.</Dialog.Title>
                            <Dialog.Description size="2" mb="4">
                                Create a new API key for one or more datasources.
                            </Dialog.Description>

                            <Flex direction="column" gap="3">
                                <label>
                                    <Text as="div" size="2" mb="1" weight="bold">
                                        Datasources
                                    </Text>
                                    <CheckboxGroup.Root defaultValue={[]} name="datasource_ids">
                                        {dataSources.map((item) =>
                                            <CheckboxGroup.Item key={item.id} onChange={(event) => setCreateButtonDisabled(new FormData(event.currentTarget.form!).getAll("datasource_ids").length == 0)}
                                                                value={item.id}>{item.id}</CheckboxGroup.Item>)}
                                    </CheckboxGroup.Root>
                                </label>
                            </Flex>

                            <Flex gap="3" mt="4" justify="end">
                                <Dialog.Close>
                                    <Button variant="soft" color="gray">
                                        Cancel
                                    </Button>
                                </Dialog.Close>
                                <Button type={"submit"} disabled={createButtonDisabled}>Create</Button>
                            </Flex>
                        </form>
                    }
                </Dialog.Content>
            </Dialog.Root>
        }</>;
}


function ApiKeysTable({apiKeys}: {apiKeys: ApiKey[]}) {
    const [confirmingDeleteForKeyId, setConfirmingDeleteForKeyId] = useState<string | null>(null);
    const {idToken} = useAuth();
    const {trigger} = useSWRMutation('m/apikeys', deleteApiKeyFetcher);

    return <Flex direction="column" gap="3">
        <AlertDialog.Root open={confirmingDeleteForKeyId !== null}
                          onOpenChange={() => setConfirmingDeleteForKeyId(null)}>
            <AlertDialog.Content>
                <AlertDialogTitle>Delete API key: {confirmingDeleteForKeyId}</AlertDialogTitle>
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
                                if (confirmingDeleteForKeyId === null || idToken === null) {
                                    throw Error("invalid state");
                                }
                                await trigger({
                                    token: idToken,
                                    apikey_id: confirmingDeleteForKeyId
                                });
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
                    <Table.ColumnHeaderCell>Datasources</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {apiKeys.map((item) => {
                    return <Table.Row key={item.id}>
                        <Table.Cell>{item.id}</Table.Cell>
                        <Table.Cell><DatasourceBadges datasourceIds={item.datasource_ids}/></Table.Cell>
                        <Table.Cell><TrashIcon onClick={() => setConfirmingDeleteForKeyId(item.id)}/></Table.Cell>
                    </Table.Row>
                })}
            </Table.Body>
        </Table.Root>
    </Flex>;
}


export default function Page() {
    const {data: apiKeys, isLoading: apiKeysLoading, error: apiKeysError} = useSWR<ApiKey[]>("m/apikeys");
    const {
        data: dataSources,
        isLoading: dataSourcesLoading,
        error: dataSourcesError
    } = useSWR<Datasource[]>("m/datasources");

    if (apiKeysLoading || dataSourcesLoading) {
        return <Spinner/>
    }
    if (apiKeysError || dataSourcesError) {
        return <Text>Error: {JSON.stringify({apiKeysError, dataSourcesError})}</Text>
    }
    console.log({apiKeys, dataSources});
    return <>
        <Heading>Manage API Keys</Heading>
        <CreateApiKeyDialogs dataSources={dataSources!}/>
        <ApiKeysTable apiKeys={apiKeys!}/>
    </>;
}
