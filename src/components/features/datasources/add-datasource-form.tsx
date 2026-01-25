'use client';
import { Button, Flex, RadioGroup, Text, TextField } from '@radix-ui/themes';
import { EyeClosedIcon, EyeOpenIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { ApiOnlyDsn, DsnInput, PostgresDsnSslmode } from '@/api/methods.schemas';
import { ServiceAccountJsonField } from '@/components/features/datasources/service-account-json-field';

const portMap: Record<string, string> = {
  postgres: '5432',
  redshift: '5439',
};

export type AllowedDwhTypes = Exclude<DsnInput['type'], ApiOnlyDsn['type']>;

export interface DatasourceFormData {
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
  // UI state
  dwhType: AllowedDwhTypes;
  showPassword: boolean;
}

export type AddDatasourceFormMessage =
  | { type: 'set-name'; value: string }
  | { type: 'set-host'; value: string }
  | { type: 'set-port'; value: string }
  | { type: 'set-database'; value: string }
  | { type: 'set-user'; value: string }
  | { type: 'set-password'; value: string }
  | { type: 'set-sslmode'; value: PostgresDsnSslmode }
  | { type: 'set-search-path'; value: string }
  | { type: 'set-project-id'; value: string }
  | { type: 'set-dataset'; value: string }
  | { type: 'set-credentials-json'; value: string }
  | { type: 'set-dwh-type'; value: AllowedDwhTypes }
  | { type: 'toggle-show-password' }
  | { type: 'reset' };

export function defaultDatasourceFormData(): DatasourceFormData {
  return {
    name: '',
    host: '',
    port: portMap['postgres'],
    database: '',
    user: '',
    password: '',
    sslmode: 'verify-ca',
    search_path: '',
    project_id: '',
    dataset: '',
    credentials_json: '',
    dwhType: 'postgres',
    showPassword: false,
  };
}

export function datasourceFormReducer(data: DatasourceFormData, msg: AddDatasourceFormMessage): DatasourceFormData {
  switch (msg.type) {
    case 'set-name':
      return { ...data, name: msg.value };
    case 'set-host':
      return { ...data, host: msg.value };
    case 'set-port':
      return { ...data, port: msg.value };
    case 'set-database':
      return { ...data, database: msg.value };
    case 'set-user':
      return { ...data, user: msg.value };
    case 'set-password':
      return { ...data, password: msg.value };
    case 'set-sslmode':
      return { ...data, sslmode: msg.value };
    case 'set-search-path':
      return { ...data, search_path: msg.value };
    case 'set-project-id':
      return { ...data, project_id: msg.value };
    case 'set-dataset':
      return { ...data, dataset: msg.value };
    case 'set-credentials-json':
      return { ...data, credentials_json: msg.value };
    case 'set-dwh-type': {
      const currentPortIsDefault = Object.values(portMap).includes(data.port);
      const newPort = currentPortIsDefault && portMap[msg.value] ? portMap[msg.value] : data.port;
      return { ...data, dwhType: msg.value, port: newPort };
    }
    case 'toggle-show-password':
      return { ...data, showPassword: !data.showPassword };
    case 'reset':
      return defaultDatasourceFormData();
    default:
      return data;
  }
}

interface AddDatasourceFormProps {
  data: DatasourceFormData;
  dispatch: (msg: AddDatasourceFormMessage) => void;
  isDNSError?: boolean;
}

export function AddDatasourceForm({ data, dispatch, isDNSError }: AddDatasourceFormProps) {
  const { dwhType, showPassword } = data;

  return (
    <>
      <label>
        <Text as="div" size="2" mb="1" weight="bold">
          Name
        </Text>
        <TextField.Root
          placeholder="Enter datasource name"
          required
          value={data.name}
          onChange={(e) => dispatch({ type: 'set-name', value: e.target.value })}
        />
      </label>

      <label>
        <Text as="div" size="2" mb="1" weight="bold">
          Type
        </Text>
        <RadioGroup.Root
          value={dwhType}
          onValueChange={(value) => dispatch({ type: 'set-dwh-type', value: value as AllowedDwhTypes })}
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
                value={data.host}
                onChange={(e) => dispatch({ type: 'set-host', value: e.target.value })}
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
              <Text size="1" mb="1">
                Tip: Redshift default port is 5439.
              </Text>
            )}
            <TextField.Root
              type="number"
              required
              value={data.port}
              onChange={(e) => dispatch({ type: 'set-port', value: e.target.value })}
            />
          </label>
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Database
            </Text>
            <TextField.Root
              required
              value={data.database}
              onChange={(e) => dispatch({ type: 'set-database', value: e.target.value })}
            />
          </label>
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              User
            </Text>
            <TextField.Root
              required
              value={data.user}
              onChange={(e) => dispatch({ type: 'set-user', value: e.target.value })}
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
                value={data.password}
                onChange={(e) => dispatch({ type: 'set-password', value: e.target.value })}
              />
              <Button type="button" variant="soft" onClick={() => dispatch({ type: 'toggle-show-password' })}>
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
                value={data.sslmode}
                onChange={(e) => dispatch({ type: 'set-sslmode', value: e.target.value as PostgresDsnSslmode })}
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
              value={data.search_path}
              onChange={(e) => dispatch({ type: 'set-search-path', value: e.target.value })}
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
              value={data.project_id}
              onChange={(e) => dispatch({ type: 'set-project-id', value: e.target.value })}
            />
          </label>
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Dataset
            </Text>
            <TextField.Root
              required
              key={'dataset'}
              value={data.dataset}
              onChange={(e) => dispatch({ type: 'set-dataset', value: e.target.value })}
            />
          </label>
          <ServiceAccountJsonField
            required
            value={data.credentials_json}
            onChange={(value) => dispatch({ type: 'set-credentials-json', value })}
            onProjectIdFound={(projectId) => dispatch({ type: 'set-project-id', value: projectId })}
          />
        </>
      )}
    </>
  );
}
