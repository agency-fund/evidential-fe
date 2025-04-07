'use client';
import { getGetOrganizationKey, getListOrganizationDatasourcesKey, useCreateDatasource } from '@/api/admin';
import { useState } from 'react';
import { Button, Dialog, Flex, RadioGroup, Text, TextField } from '@radix-ui/themes';
import { ServiceAccountJsonField } from '@/app/components/service-account-json-field';
import { XSpinner } from '../components/x-spinner';
import { EyeClosedIcon, EyeOpenIcon, InfoCircledIcon, PlusIcon } from '@radix-ui/react-icons';
import { BqDsnInput, Dsn } from '@/api/methods.schemas';
import { mutate } from 'swr';
import { PostgresSslModes } from '@/services/typehelper';

export function AddDatasourceDialog({ organizationId }: { organizationId: string }) {
  const { trigger, isMutating } = useCreateDatasource({
    swr: {
      onSuccess: () =>
        Promise.all([
          mutate(getListOrganizationDatasourcesKey(organizationId)),
          mutate(getGetOrganizationKey(organizationId)),
        ]),
    },
  });
  const [open, setOpen] = useState(false);
  const [dwhType, setDwhType] = useState<'postgres' | 'redshift' | 'bigquery'>('postgres');
  const [projectId, setProjectId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [credentialsJson, setCredentialsJson] = useState('');

  const visibilityToggle = (open: boolean) => {
    setDwhType('postgres');
    setOpen(open);
  };

  return (
    <Dialog.Root open={open} onOpenChange={visibilityToggle}>
      <Dialog.Trigger>
        <Button>
          <PlusIcon /> Add Datasource
        </Button>
      </Dialog.Trigger>

      <Dialog.Content>
        {isMutating ? (
          <XSpinner message="Adding datasource..." />
        ) : (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const fd = new FormData(event.currentTarget);
              const name = fd.get('name') as string;

              let dwh: Dsn | BqDsnInput;
              if (dwhType === 'postgres') {
                dwh = {
                  driver: 'postgresql+psycopg',
                  host: fd.get('host') as string,
                  port: parseInt(fd.get('port') as string),
                  dbname: fd.get('database') as string,
                  user: fd.get('user') as string,
                  password: fd.get('password') as string,
                  sslmode: fd.get('sslmode') as PostgresSslModes,
                  search_path: (fd.get('search_path') as string) || null,
                };
              } else if (dwhType === 'redshift') {
                dwh = {
                  driver: 'postgresql+psycopg2',
                  host: fd.get('host') as string,
                  port: parseInt(fd.get('port') as string),
                  dbname: fd.get('database') as string,
                  user: fd.get('user') as string,
                  password: fd.get('password') as string,
                  sslmode: 'verify-full',
                  search_path: (fd.get('search_path') as string) || null,
                };
              } else {
                dwh = {
                  driver: 'bigquery',
                  project_id: fd.get('project_id') as string,
                  dataset_id: fd.get('dataset') as string,
                  credentials: {
                    type: 'serviceaccountinfo',
                    content_base64: btoa(fd.get('credentials_json') as string),
                  },
                };
              }

              await trigger({
                organization_id: organizationId,
                name,
                dwh,
              });
              setDwhType('postgres');
              setOpen(false);
            }}
          >
            <Dialog.Title>Add Datasource</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              <Text>Add a datasource to this organization.</Text>
            </Dialog.Description>

            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Name
                </Text>
                <TextField.Root name="name" placeholder="Enter datasource name" required></TextField.Root>
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Type
                </Text>
                <RadioGroup.Root
                  defaultValue="postgres"
                  onValueChange={(value) => {
                    setDwhType(value as 'postgres' | 'bigquery');
                    setProjectId(''); // Reset projectId when switching form types
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
                    <TextField.Root name="host" required />
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
                    <TextField.Root name="port" type="number" defaultValue="5432" required />
                  </label>
                  <label>
                    <Text as="div" size="2" mb="1" weight="bold">
                      Database
                    </Text>
                    <TextField.Root name="database" required />
                  </label>
                  <label>
                    <Text as="div" size="2" mb="1" weight="bold">
                      User
                    </Text>
                    <TextField.Root name="user" required />
                  </label>
                  <label>
                    <Text as="div" size="2" mb="1" weight="bold">
                      Password
                    </Text>
                    <Flex gap="2">
                      <TextField.Root name="password" type={showPassword ? 'text' : 'password'} required />
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
                      <select name="sslmode" defaultValue="verify-ca">
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
                    <TextField.Root name="search_path" />
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
                      name="project_id"
                      required
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                    />
                  </label>
                  <label>
                    <Text as="div" size="2" mb="1" weight="bold">
                      Dataset
                    </Text>
                    <TextField.Root name="dataset" required key={'dataset'} />
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
              <Button type="submit">Add Datasource</Button>
            </Flex>
          </form>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
