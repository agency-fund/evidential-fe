'use client';
import { getGetOrganizationKey, getListOrganizationDatasourcesKey, useCreateDatasource } from '@/api/admin';
import { useState } from 'react';
import { Button, Dialog, Flex, RadioGroup, Text, TextField } from '@radix-ui/themes';
import { ServiceAccountJsonField } from '@/components/features/datasources/service-account-json-field';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { EyeClosedIcon, EyeOpenIcon, InfoCircledIcon, PlusIcon } from '@radix-ui/react-icons';
import { ApiOnlyDsn, BqDsnInput, DsnInput, PostgresDsn, PostgresDsnSslmode, RedshiftDsn } from '@/api/methods.schemas';
import { mutate } from 'swr';
import { PostgresSslModes } from '@/services/typehelper';
import { ApiError } from '@/services/orval-fetch';

type AllowedDwhTypes = Exclude<DsnInput['type'], ApiOnlyDsn['type']>;

interface FormFields {
  name: string;
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
  sslmode: PostgresDsnSslmode;
  search_path: string;
  project_id: string;
  dataset: string;
  credentials_json: string;
}

const defaultFormData = (): FormFields => ({
  name: '',
  host: '',
  port: '5432',
  database: '',
  user: '',
  password: '',
  sslmode: 'verify-ca',
  search_path: '',
  project_id: '',
  dataset: '',
  credentials_json: '',
});

export function AddDatasourceDialog({ organizationId }: { organizationId: string }) {
  const [open, setOpen] = useState(false);
  const [dwhType, setDwhType] = useState<AllowedDwhTypes>('postgres');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState(defaultFormData());
  const { trigger, reset, error } = useCreateDatasource({
    swr: {
      onSuccess: () => {
        handleClose();
        Promise.all([
          mutate(getListOrganizationDatasourcesKey(organizationId)),
          mutate(getGetOrganizationKey(organizationId)),
        ]);
      },
    },
  });

  const handleClose = () => {
    setFormData(defaultFormData());
    setDwhType('postgres');
    reset();
    setOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    let dsn: PostgresDsn | RedshiftDsn | BqDsnInput;
    if (dwhType === 'postgres') {
      dsn = {
        type: 'postgres',
        host: formData.host,
        port: parseInt(formData.port),
        dbname: formData.database,
        user: formData.user,
        password: { type: 'revealed', value: formData.password },
        sslmode: formData.sslmode as PostgresSslModes,
        search_path: formData.search_path || null,
      };
    } else if (dwhType === 'redshift') {
      dsn = {
        type: 'redshift',
        host: formData.host,
        port: parseInt(formData.port),
        dbname: formData.database,
        user: formData.user,
        password: { type: 'revealed', value: formData.password },
        search_path: formData.search_path || null,
      };
    } else {
      dsn = {
        type: 'bigquery',
        project_id: formData.project_id,
        dataset_id: formData.dataset,
        credentials: {
          type: 'serviceaccountinfo',
          content: formData.credentials_json,
        },
      };
    }

    await trigger(
      {
        organization_id: organizationId,
        name: formData.name,
        dsn,
      },
      {
        throwOnError: false,
      },
    );
  };

  const isDNSError = error instanceof ApiError && error.response.status === 400;

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
        <Button>
          <PlusIcon /> Add Datasource
        </Button>
      </Dialog.Trigger>

      <Dialog.Content>
        <form onSubmit={handleSubmit}>
          <Dialog.Title>Add Datasource</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            <Text>Add a datasource to this organization.</Text>
          </Dialog.Description>

          {error && !isDNSError && <GenericErrorCallout title="Failed to add datasource" error={error} />}

          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Name
              </Text>
              <TextField.Root
                placeholder="Enter datasource name"
                required
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Type
              </Text>
              <RadioGroup.Root
                defaultValue="postgres"
                onValueChange={(value) => {
                  setDwhType(value as 'postgres' | 'redshift' | 'bigquery');
                }}
              >
                <Flex gap="2" direction="column">
                  <Text as="label" size="2">
                    <Flex gap="2">
                      <RadioGroup.Item value="postgres" /> PostgreSQL
                    </Flex>
                  </Text>
                  <Text as="label" size="2">
                    <Flex gap="2">
                      <RadioGroup.Item value="redshift" /> Redshift
                    </Flex>
                  </Text>
                  <Text as="label" size="2">
                    <Flex gap="2">
                      <RadioGroup.Item value="bigquery" /> Google BigQuery
                    </Flex>
                  </Text>
                </Flex>
              </RadioGroup.Root>
            </label>

            {dwhType === 'postgres' || dwhType === 'redshift' ? (
              <>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Host
                  </Text>
                  <Flex direction="column" gap="2">
                    <TextField.Root
                      required
                      value={formData.host}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, host: e.target.value }));
                      }}
                      color={isDNSError ? 'red' : undefined}
                      variant={isDNSError ? 'soft' : 'surface'}
                    />
                    {isDNSError && (
                      <Flex align="center" gap="1">
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
                  {dwhType === 'redshift' && (
                    <Text size={'1'} mb={'1'}>
                      Tip: Redshift default port is 5439.
                    </Text>
                  )}
                  <TextField.Root
                    type="number"
                    required
                    value={formData.port}
                    onChange={(e) => setFormData((prev) => ({ ...prev, port: e.target.value }))}
                  />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Database
                  </Text>
                  <TextField.Root
                    required
                    value={formData.database}
                    onChange={(e) => setFormData((prev) => ({ ...prev, database: e.target.value }))}
                  />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    User
                  </Text>
                  <TextField.Root
                    required
                    value={formData.user}
                    onChange={(e) => setFormData((prev) => ({ ...prev, user: e.target.value }))}
                  />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Password
                  </Text>
                  <Flex gap="2">
                    <TextField.Root
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    />
                    <Button type="button" variant="soft" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    </Button>
                  </Flex>
                </label>
                {dwhType === 'postgres' && (
                  <label>
                    <Text as="div" size="2" mb="1" weight="bold">
                      SSL Mode
                    </Text>
                    <select
                      value={formData.sslmode}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, sslmode: e.target.value as PostgresDsnSslmode }))
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
            ) : (
              <>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Project ID
                  </Text>
                  <TextField.Root
                    key={'project_id'}
                    required
                    value={formData.project_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, project_id: e.target.value }))}
                  />
                </label>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Dataset
                  </Text>
                  <TextField.Root
                    required
                    key={'dataset'}
                    value={formData.dataset}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dataset: e.target.value }))}
                  />
                </label>
                <ServiceAccountJsonField
                  required
                  value={formData.credentials_json}
                  onChange={(value) => setFormData((prev) => ({ ...prev, credentials_json: value }))}
                  onProjectIdFound={(projectId) => setFormData((prev) => ({ ...prev, project_id: projectId }))}
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
            <Button type="submit">Add Datasource</Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
