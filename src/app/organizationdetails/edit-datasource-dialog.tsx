'use client';
import { Button, Dialog, Flex, IconButton, Text, TextField } from '@radix-ui/themes';
import { ServiceAccountJsonField } from '@/app/components/service-account-json-field';
import { EyeClosedIcon, EyeOpenIcon, GearIcon, Pencil2Icon } from '@radix-ui/react-icons';
import {
  getGetDatasourceKey,
  getGetOrganizationKey,
  getInspectDatasourceKey,
  useGetDatasource,
  useUpdateDatasource,
} from '@/api/admin';
import { useEffect, useState } from 'react';
import { mutate } from 'swr';
import { isHttpOk } from '@/services/typehelper';
import { DsnDriver, UpdateDatasourceRequest } from '@/api/methods.schemas';

export const EditDatasourceDialog = ({
  organizationId,
  datasourceId,
  variant = 'icon',
}: {
  organizationId?: string;
  datasourceId: string;
  variant?: 'icon' | 'button';
}) => {
  const { trigger: updateDatasource } = useUpdateDatasource(datasourceId);
  const { data, isLoading } = useGetDatasource(datasourceId);
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [dbname, setDbname] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [searchPath, setSearchPath] = useState('');
  const [sslmode, setSslmode] = useState<'disable' | 'allow' | 'prefer' | 'require'>('prefer');
  const [projectId, setProjectId] = useState('');
  const [dataset, setDataset] = useState('');
  const [credentialsJson, setCredentialsJson] = useState('');

  useEffect(() => {
    if (open && data && isHttpOk(data)) {
      const datasource = data.data;
      setName(datasource.name);
      if (datasource.config.type === 'remote') {
        const dwh = datasource.config.dwh;

        if (dwh.driver === 'bigquery') {
          if (dwh.credentials.type !== 'serviceaccountinfo') {
            throw new Error('only serviceaccountinfo is supported');
          }
          setProjectId(dwh.project_id);
          setDataset(dwh.dataset_id);
          setCredentialsJson(atob(dwh.credentials.content_base64));
        } else {
          setHost(dwh.host);
          setPort(dwh.port ? dwh.port.toString() : '5432');
          setDbname(dwh.dbname);
          setUser(dwh.user);
          setPassword(dwh.password);
          // TODO: support the extra modes
          setSslmode((dwh.sslmode || 'prefer') as 'disable' | 'allow' | 'prefer' | 'require');
          setSearchPath(dwh.search_path || '');
        }
      }
    }
  }, [open, data]);


  if (isLoading || !data || !isHttpOk(data)) {
    return null;
  }

  const datasource = data.data;
  const config = datasource.config;

  if (config.type !== 'remote') {
    return null;
  }

  const isBigQuery = config.dwh.driver === 'bigquery';

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        {variant === 'icon' ? (
          <IconButton color="gray" variant="soft">
            <Pencil2Icon />
          </IconButton>
        ) : (
          <Button>
            <GearIcon />
            Configure Connection
          </Button>
        )}
      </Dialog.Trigger>

      <Dialog.Content>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const updateData: UpdateDatasourceRequest = {
              name,
            };

            if (!isBigQuery) {
              updateData.dwh = {
                driver: DsnDriver['postgresql+psycopg'],
                host,
                port: parseInt(port),
                dbname,
                user,
                password,
                sslmode,
                search_path: searchPath || null,
              };
            } else {
              updateData.dwh = {
                driver: 'bigquery',
                project_id: projectId,
                dataset_id: dataset,
                credentials: {
                  type: 'serviceaccountinfo',
                  content_base64: btoa(credentialsJson),
                },
              };
            }

            await updateDatasource(updateData);
            if (organizationId) {
              await mutate(getGetOrganizationKey(organizationId));
            }
            await mutate(getGetDatasourceKey(datasourceId));
            await mutate(getInspectDatasourceKey(datasourceId));
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
              <TextField.Root name="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>

            {config.dwh.driver !== 'bigquery' && (
              <>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Host
                  </Text>
                  <TextField.Root name="host" value={host} onChange={(e) => setHost(e.target.value)} required />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Port
                  </Text>
                  <TextField.Root
                    name="port"
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Database
                  </Text>
                  <TextField.Root name="dbname" value={dbname} onChange={(e) => setDbname(e.target.value)} required />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    User
                  </Text>
                  <TextField.Root name="user" value={user} onChange={(e) => setUser(e.target.value)} required />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Password
                  </Text>
                  <Flex gap="2">
                    <TextField.Root
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button type="button" variant="soft" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    </Button>
                  </Flex>
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    SSL Mode
                  </Text>
                  <select
                    name="sslmode"
                    value={sslmode}
                    onChange={(e) => setSslmode(e.target.value as 'disable' | 'allow' | 'prefer' | 'require')}
                  >
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
                  <TextField.Root
                    name="search_path"
                    value={searchPath}
                    onChange={(e) => setSearchPath(e.target.value)}
                  />
                </label>
              </>
            )}

            {config.dwh.driver === 'bigquery' && config.dwh.credentials.type == 'serviceaccountinfo' && (
              <>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Project ID
                  </Text>
                  <TextField.Root
                    name="project_id"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Dataset
                  </Text>
                  <TextField.Root
                    name="dataset"
                    value={dataset}
                    onChange={(e) => setDataset(e.target.value)}
                    required
                  />
                </label>
                <ServiceAccountJsonField
                  value={credentialsJson}
                  onChange={setCredentialsJson}
                  onProjectIdFound={setProjectId}
                />
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
