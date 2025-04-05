'use client';
import { Button, Dialog, Flex, IconButton, Text, TextField } from '@radix-ui/themes';
import { ServiceAccountJsonField } from '@/app/components/service-account-json-field';
import { EyeClosedIcon, EyeOpenIcon, GearIcon, InfoCircledIcon, Pencil2Icon } from '@radix-ui/react-icons';
import {
  getGetDatasourceKey,
  getGetOrganizationKey,
  getInspectDatasourceKey,
  useGetDatasource,
  useUpdateDatasource,
} from '@/api/admin';
import { useEffect, useState } from 'react';
import { mutate } from 'swr';
import { DsnDriver, UpdateDatasourceRequest } from '@/api/methods.schemas';
import { GenericErrorCallout } from '@/app/components/generic-error';
import { PostgresSslModes } from '@/services/typehelper';

export const EditDatasourceDialog = ({
  organizationId,
  datasourceId,
  onOpenChange,
  variant = 'icon',
}: {
  organizationId?: string;
  datasourceId: string;
  onOpenChange?: (open: boolean) => void;
  variant?: 'icon' | 'button';
}) => {
  const {
    trigger: updateDatasource,
    error,
    reset,
  } = useUpdateDatasource(datasourceId, {
    swr: {
      onSuccess: () =>
        Promise.all([
          mutate(getGetDatasourceKey(datasourceId)),
          mutate(getInspectDatasourceKey(datasourceId)),
          ...(organizationId ? [mutate(getGetOrganizationKey(organizationId))] : []),
        ]),
    },
  });
  const { data, isLoading } = useGetDatasource(datasourceId);
  const [open, setOpen] = useState(false);

  // Notify parent when open state changes
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
    setOpen(newOpen);
  };

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [dbname, setDbname] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [searchPath, setSearchPath] = useState('');
  const [sslmode, setSslmode] = useState<PostgresSslModes>('require');
  const [projectId, setProjectId] = useState('');
  const [dataset, setDataset] = useState('');
  const [credentialsJson, setCredentialsJson] = useState('');

  useEffect(() => {
    if (open && data) {
      const datasource = data;
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
          // Only use a subset of the possible configuration options.
          const fallbackType = 'require';
          const obsolete_modes = ['prefer', 'allow'];
          const sslmode = dwh.sslmode
            ? obsolete_modes.includes(dwh.sslmode)
              ? fallbackType
              : (dwh.sslmode as PostgresSslModes)
            : fallbackType;
          setSslmode(sslmode);
          setSearchPath(dwh.search_path || '');
        }
      }
    }
  }, [open, data]);

  if (isLoading || !data) {
    return null;
  }

  const config = data.config;

  if (config.type !== 'remote') {
    return null;
  }

  const isBigQuery = config.dwh.driver === 'bigquery';
  const isRedshift = config.dwh.driver === 'postgresql+psycopg2' && config.dwh.host.endsWith('redshift.amazonaws.com');

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(op) => {
        handleOpenChange(op);
        if (!op) {
          reset();
        }
      }}
    >
      <Dialog.Trigger>
        {variant === 'icon' ? (
          <IconButton color="gray" variant="soft">
            <Pencil2Icon />
          </IconButton>
        ) : (
          <Button>
            <GearIcon />
            Configure
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
                driver: config.dwh.driver as DsnDriver, // Don't change the driver type!
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
            handleOpenChange(false);
          }}
        >
          <Dialog.Title>Edit Datasource</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Update the datasource settings.
          </Dialog.Description>

          {error && <GenericErrorCallout title={'Failed to update datasource'} error={error} />}

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
                      {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    </Button>
                  </Flex>
                </label>
                {!isRedshift && (
                  <label>
                    <Text as="div" size="2" mb="1" weight="bold">
                      SSL Mode
                    </Text>
                    <select
                      name="sslmode"
                      value={sslmode}
                      onChange={(e) => setSslmode(e.target.value as PostgresSslModes)}
                    >
                      <option value="disable">disable</option>
                      <option value="require">require</option>
                      <option value="verify-ca">verify-ca</option>
                      <option value="verify-full">verify-full</option>
                    </select>
                  </label>
                )}
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Search Path{' '}
                    <a
                      href="https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Learn more about the schema search path"
                    >
                      <InfoCircledIcon style={{ verticalAlign: 'middle' }} />
                    </a>
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
