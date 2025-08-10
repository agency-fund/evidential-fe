'use client';
import { Button, Dialog, Flex, IconButton, Text, TextField } from '@radix-ui/themes';
import { ServiceAccountJsonField } from '@/components/features/datasources/service-account-json-field';
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
import { GcpServiceAccount, Hidden, RevealedStr, UpdateDatasourceRequest } from '@/api/methods.schemas';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { PostgresSslModes } from '@/services/typehelper';
import { XNGIN_API_DOCS_LINK } from '@/services/constants';

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
    if (!newOpen) {
      setShowPassword(false);
    }
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
  const [password, setPassword] = useState<RevealedStr | Hidden>({ type: 'hidden' });
  const [searchPath, setSearchPath] = useState('');
  const [sslmode, setSslmode] = useState<PostgresSslModes>('require');
  const [projectId, setProjectId] = useState('');
  const [dataset, setDataset] = useState('');
  const [credentialsJson, setCredentialsJson] = useState<GcpServiceAccount | Hidden>({ type: 'hidden' });

  useEffect(() => {
    if (open && data) {
      const dsn = data.dsn;
      setName(data.name);
      if (dsn.type === 'api_only') {
        return;
      }
      if (dsn.type === 'bigquery') {
        setProjectId(dsn.project_id);
        setDataset(dsn.dataset_id);
        setCredentialsJson(dsn.credentials);
      } else if (dsn.type === 'postgres' || dsn.type == 'redshift') {
        setHost(dsn.host);
        setPort(dsn.port ? dsn.port.toString() : '5432');
        setDbname(dsn.dbname);
        setUser(dsn.user);
        setPassword(dsn.password);
        // Only send sslmode for postgres.
        if (dsn.type === 'postgres') {
          // Only use a subset of the possible configuration options.
          const fallbackType = 'require';
          const obsolete_modes = ['prefer', 'allow'];
          const sslmode = dsn.sslmode
            ? obsolete_modes.includes(dsn.sslmode)
              ? fallbackType
              : (dsn.sslmode as PostgresSslModes)
            : fallbackType;
          setSslmode(sslmode);
        }
        setSearchPath(dsn.search_path || '');
      }
    }
  }, [open, data]);

  if (isLoading || !data) {
    return null;
  }

  const dsn = data.dsn;

  const isBigQuery = dsn.type === 'bigquery';
  const isNoDWH = dsn.type === 'api_only';
  const isRedshift = dsn.type === 'redshift';

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

            if (isNoDWH) {
              updateData.dsn = {
                type: 'api_only',
              };
            } else if (isBigQuery) {
              updateData.dsn = {
                type: 'bigquery',
                project_id: projectId,
                dataset_id: dataset,
                credentials: credentialsJson,
              };
            } else if (isRedshift) {
              updateData.dsn = {
                type: 'redshift',
                host,
                port: parseInt(port),
                dbname,
                user,
                password,
                search_path: searchPath || null,
              };
            } else {
              updateData.dsn = {
                type: 'postgres',
                host,
                port: parseInt(port),
                dbname,
                user,
                password,
                sslmode,
                search_path: searchPath || null,
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

            {isNoDWH && (
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  This datasource is not connected to a data warehouse.
                </Text>
                <Text as="div" size="2" mb="1">
                  Experiments associated with this source must request draws (arm assignments) and supply metric
                  outcomes through the{' '}
                  <a href={XNGIN_API_DOCS_LINK} target="_blank" rel="noopener noreferrer">
                    Experiment Integration APIs
                  </a>
                  .
                </Text>
              </label>
            )}

            {!isNoDWH && !isBigQuery && (
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
                      onChange={(e) => setPassword({ type: 'revealed', value: e.target.value })}
                      placeholder={password.type === 'hidden' ? '(hidden)' : undefined}
                      required={password.type !== 'hidden'}
                      value={password.type === 'revealed' ? password.value : ''}
                    />
                    <Button
                      type="button"
                      variant="soft"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={password.type === 'hidden'}
                    >
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

            {isBigQuery && (
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
                  onChange={(value) => setCredentialsJson({ type: 'serviceaccountinfo', content: value })}
                  onProjectIdFound={setProjectId}
                  placeholder={credentialsJson.type === 'hidden' ? '(hidden)' : undefined}
                  required={credentialsJson.type !== 'hidden'}
                  value={credentialsJson.type === 'hidden' ? '' : credentialsJson.content}
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
