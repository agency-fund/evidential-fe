'use client';
import { Button, Dialog, Flex, IconButton, Text, TextField } from '@radix-ui/themes';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { useGetDatasource, useUpdateDatasource } from '@/api/admin';
import { useState } from 'react';
import { mutate } from 'swr';
import { isSuccessResponse } from '@/services/typehelper';
import { DsnDriver } from '@/api/methods.schemas';

interface EditDatasourceDialogProps {
  organizationId: string;
  datasourceId: string;
}

export const EditDatasourceDialog = ({ organizationId, datasourceId }: EditDatasourceDialogProps) => {
  const { trigger: updateDatasource } = useUpdateDatasource(datasourceId);
  const { data, isLoading } = useGetDatasource(datasourceId);
  const [open, setOpen] = useState(false);

  if (isLoading || !data || !isSuccessResponse(data)) {
    return null;
  }

  const datasource = data.data;
  const config = datasource.config;

  if (config.type !== 'remote') {
    return null;
  }

  const isPostgres = config.dwh.driver === DsnDriver['postgresql+psycopg'];
  const isBigQuery = config.dwh.driver === 'bigquery';

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <IconButton color="gray" variant="soft">
          <Pencil2Icon />
        </IconButton>
      </Dialog.Trigger>

      <Dialog.Content>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            const name = fd.get('name') as string;

            const updateData: {
              name: string;
              dwh?: {
                driver: DsnDriver | 'bigquery';
                host?: string;
                port?: number;
                dbname?: string;
                user?: string;
                password?: string;
                sslmode?: 'disable' | 'allow' | 'prefer' | 'require';
                search_path?: string | null;
                project_id?: string;
                dataset_id?: string;
                credentials?: {
                  type: 'serviceaccountinfo';
                  content_base64: string;
                };
              };
            } = {
              name,
            };

            if (isPostgres) {
              updateData.dwh = {
                driver: DsnDriver['postgresql+psycopg'],
                host: fd.get('host') as string,
                port: parseInt(fd.get('port') as string),
                dbname: fd.get('dbname') as string,
                user: fd.get('user') as string,
                password: fd.get('password') as string,
                sslmode: fd.get('sslmode') as 'disable' | 'allow' | 'prefer' | 'require',
                search_path: (fd.get('search_path') as string) || null,
              };
            } else if (isBigQuery) {
              updateData.dwh = {
                driver: 'bigquery',
                project_id: fd.get('project_id') as string,
                dataset_id: fd.get('dataset') as string,
                credentials: {
                  type: 'serviceaccountinfo',
                  content_base64: btoa(fd.get('credentials_json') as string),
                },
              };
            }

            await updateDatasource(updateData);
            await mutate([`/v1/m/organizations/${organizationId}`]);
            setOpen(false);
          }}
        >
          <Dialog.Title>Edit Datasource</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Update the datasource settings.
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Name
              </Text>
              <TextField.Root name="name" defaultValue={datasource.name} required />
            </label>

            {isPostgres && (
              <>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Host
                  </Text>
                  <TextField.Root name="host" defaultValue={config.dwh.host} required />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Port
                  </Text>
                  <TextField.Root name="port" type="number" defaultValue={config.dwh.port} required />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Database
                  </Text>
                  <TextField.Root name="dbname" defaultValue={config.dwh.dbname} required />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    User
                  </Text>
                  <TextField.Root name="user" defaultValue={config.dwh.user} required />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Password
                  </Text>
                  <TextField.Root name="password" type="password" defaultValue={config.dwh.password} required />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    SSL Mode
                  </Text>
                  <select name="sslmode" defaultValue={config.dwh.sslmode || 'prefer'}>
                    <option value="disable">disable</option>
                    <option value="allow">allow</option>
                    <option value="prefer">prefer</option>
                    <option value="require">require</option>
                  </select>
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Search Path
                  </Text>
                  <TextField.Root name="search_path" defaultValue={config.dwh.search_path || ''} />
                </label>
              </>
            )}

            {isBigQuery && (
              <>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Project ID
                  </Text>
                  <TextField.Root name="project_id" defaultValue={config.dwh.project_id} required />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Dataset
                  </Text>
                  <TextField.Root name="dataset" defaultValue={config.dwh.dataset_id} required />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Service Account JSON
                  </Text>
                  <TextField.Root
                    name="credentials_json"
                    defaultValue={atob(config.dwh.credentials.content_base64)}
                    required
                  />
                </label>
              </>
            )}
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="submit">Save Changes</Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};
