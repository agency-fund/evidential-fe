'use client';
import { Button, Dialog, Flex, IconButton, Text, TextField } from '@radix-ui/themes';
import { ServiceAccountJsonField } from '@/components/features/datasources/service-account-json-field';
import { GenericErrorCallout } from '@/components/ui/generic-error';
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
import { PostgresSslModes } from '@/services/typehelper';
import { XNGIN_API_DOCS_LINK } from '@/services/constants';
import { ApiError } from '@/services/orval-fetch';

interface FormFields {
  name: string;
  host: string;
  port: string;
  dbname: string;
  user: string;
  password: RevealedStr | Hidden;
  sslmode: PostgresSslModes;
  search_path: string;
  project_id: string;
  dataset: string;
  credentials_json: GcpServiceAccount | Hidden;
}

const defaultFormData = (): FormFields => ({
  name: '',
  host: '',
  port: '',
  dbname: '',
  user: '',
  password: { type: 'hidden' },
  search_path: '',
  sslmode: 'require',
  project_id: '',
  dataset: '',
  credentials_json: { type: 'hidden' },
});

export const EditDatasourceDialog = ({
  organizationId,
  datasourceId,
  variant = 'icon',
}: {
  organizationId?: string;
  datasourceId: string;
  variant?: 'icon' | 'button';
}) => {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState(defaultFormData());

  const { data, isLoading } = useGetDatasource(datasourceId);
  const {
    trigger: updateDatasource,
    reset,
    error,
  } = useUpdateDatasource(datasourceId, {
    swr: {
      onSuccess: async () => {
        handleClose();
        await Promise.all([
          mutate(getGetDatasourceKey(datasourceId)),
          mutate(getInspectDatasourceKey(datasourceId)),
          ...(organizationId ? [mutate(getGetOrganizationKey(organizationId))] : []),
        ]);
      },
    },
  });

  useEffect(() => {
    if (open && data) {
      const dsn = data.dsn;
      let newFormData: FormFields = {
        ...defaultFormData(),
        name: data.name,
      };

      if (dsn.type === 'api_only') {
        setFormData(newFormData);
        return;
      }
      if (dsn.type === 'bigquery') {
        newFormData = {
          ...newFormData,
          project_id: dsn.project_id,
          dataset: dsn.dataset_id,
          credentials_json: dsn.credentials,
        };
      } else if (dsn.type === 'postgres' || dsn.type == 'redshift') {
        newFormData = {
          ...newFormData,
          host: dsn.host,
          port: dsn.port ? dsn.port.toString() : '5432',
          dbname: dsn.dbname,
          user: dsn.user,
          password: dsn.password,
          search_path: dsn.search_path || '',
        };
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
          newFormData = {
            ...newFormData,
            sslmode,
          };
        }
      }
      setFormData(newFormData);
    }
  }, [open, data]);

  if (isLoading || !data) {
    return null;
  }

  const dsn = data.dsn;
  const isBigQuery = dsn.type === 'bigquery';
  const isNoDWH = dsn.type === 'api_only';
  const isRedshift = dsn.type === 'redshift';
  const isDNSError = error instanceof ApiError && error.response.status === 400;

  const handleClose = () => {
    setShowPassword(false);
    reset();
    setOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const updateData: UpdateDatasourceRequest = {
      name: formData.name,
    };

    if (isNoDWH) {
      updateData.dsn = {
        type: 'api_only',
      };
    } else if (isBigQuery) {
      updateData.dsn = {
        type: 'bigquery',
        project_id: formData.project_id,
        dataset_id: formData.dataset,
        credentials: formData.credentials_json,
      };
    } else if (isRedshift) {
      updateData.dsn = {
        type: 'redshift',
        host: formData.host,
        port: parseInt(formData.port),
        dbname: formData.dbname,
        user: formData.user,
        password: formData.password,
        search_path: formData.search_path || null,
      };
    } else {
      updateData.dsn = {
        type: 'postgres',
        host: formData.host,
        port: parseInt(formData.port),
        dbname: formData.dbname,
        user: formData.user,
        password: formData.password,
        sslmode: formData.sslmode,
        search_path: formData.search_path || null,
      };
    }

    await updateDatasource(updateData, {
      throwOnError: false,
    });
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(op) => {
        if (!op) {
          handleClose();
        } else {
          setOpen(op);
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
        <form onSubmit={handleSubmit}>
          <Dialog.Title>Edit Datasource</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Update the datasource settings.
          </Dialog.Description>

          {error && !isDNSError && <GenericErrorCallout title="Failed to update datasource" error={error} />}

          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Name
              </Text>
              <TextField.Root
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
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
                  <Flex direction="column" gap="2">
                    <TextField.Root
                      value={formData.host}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, host: e.target.value }));
                      }}
                      color={isDNSError ? 'red' : undefined}
                      variant={isDNSError ? 'soft' : 'surface'}
                      required
                    />
                    {isDNSError && (
                      <Flex align="center" gap="2">
                        <InfoCircledIcon color="red" />
                        <Text size="1" color="red">
                          This hostname does not resolve. Please try again.
                        </Text>
                      </Flex>
                    )}
                  </Flex>
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Port
                  </Text>
                  <TextField.Root
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData((prev) => ({ ...prev, port: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Database
                  </Text>
                  <TextField.Root
                    value={formData.dbname}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dbname: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    User
                  </Text>
                  <TextField.Root
                    value={formData.user}
                    onChange={(e) => setFormData((prev) => ({ ...prev, user: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Password
                  </Text>
                  <Flex gap="2">
                    <TextField.Root
                      type={showPassword ? 'text' : 'password'}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, password: { type: 'revealed', value: e.target.value } }))
                      }
                      placeholder={formData.password.type === 'hidden' ? '(hidden)' : undefined}
                      required={formData.password.type !== 'hidden'}
                      value={formData.password.type === 'revealed' ? formData.password.value : ''}
                    />
                    <Button
                      type="button"
                      variant="soft"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={formData.password.type === 'hidden'}
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
                      value={formData.sslmode}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, sslmode: e.target.value as PostgresSslModes }))
                      }
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
                    value={formData.search_path}
                    onChange={(e) => setFormData((prev) => ({ ...prev, search_path: e.target.value }))}
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
                    value={formData.project_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, project_id: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Dataset
                  </Text>
                  <TextField.Root
                    value={formData.dataset}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dataset: e.target.value }))}
                    required
                  />
                </label>
                <ServiceAccountJsonField
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      credentials_json: { type: 'serviceaccountinfo', content: value },
                    }))
                  }
                  onProjectIdFound={(projectId) => setFormData((prev) => ({ ...prev, project_id: projectId }))}
                  placeholder={formData.credentials_json.type === 'hidden' ? '(hidden)' : undefined}
                  required={formData.credentials_json.type !== 'hidden'}
                  value={formData.credentials_json.type === 'hidden' ? '' : formData.credentials_json.content}
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
