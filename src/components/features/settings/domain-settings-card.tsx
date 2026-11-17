'use client';
import { useState } from 'react';
import {
  Box,
  Button,
  Callout,
  Code,
  Flex,
  Heading,
  IconButton,
  Switch,
  Text,
  TextField,
  Tooltip,
} from '@radix-ui/themes';
import { InfoCircledIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { mutate } from 'swr';
import {
  getListDomainSettingsKey,
  ListDomainSettingsQueryError,
  useCreateDomainSettings,
  useDeleteDomainSettings,
  useListDomainSettings,
  useUpdateDomainSettings,
} from '@/api/admin';
import { DomainSettingsSummary } from '@/api/methods.schemas';
import { SectionCard } from '@/components/ui/cards/section-card';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { XSpinner } from '@/components/ui/x-spinner';

// Mirrors normalize_domain() in the API server, which is authoritative.
const DOMAIN_PATTERN = /^(?=.{1,128}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

const DOMAINS_TOOLTIP =
  "Per-domain settings allow the application of policies based on a user's email address. Domains are matched exactly.";

const normalizeDomain = (raw: string) => raw.trim().replace(/^@/, '').toLowerCase();

const revalidateDomainSettings = () => mutate(getListDomainSettingsKey());

interface DomainSettingsRowProps {
  domainSettings: DomainSettingsSummary;
}

function DomainSettingsRow({ domainSettings }: DomainSettingsRowProps) {
  const update = useUpdateDomainSettings(domainSettings.id, { swr: { onSuccess: revalidateDomainSettings } });
  const remove = useDeleteDomainSettings(domainSettings.id, undefined, {
    swr: { onSuccess: revalidateDomainSettings },
  });

  const isMutating = update.isMutating || remove.isMutating;
  const error = update.error ?? remove.error;

  const setAllowSignup = async (allow_signup: boolean) => {
    await update.trigger({ allow_signup }, { throwOnError: false });
  };

  const deleteDomain = async () => {
    await remove.trigger(undefined, { throwOnError: false });
  };

  return (
    <Flex direction="column" gap="1">
      <Flex align="center" justify="between" gap="3" maxWidth="420px">
        <Code size="3" variant="soft" color="gray">
          {domainSettings.domain}
        </Code>
        <Flex align="center" gap="3">
          <Text as="label" size="2" color="gray">
            <Flex align="center" gap="2">
              <Switch
                size="1"
                checked={domainSettings.allow_signup}
                onCheckedChange={setAllowSignup}
                disabled={isMutating}
              />
              Allow sign-up
            </Flex>
          </Text>
          <IconButton type="button" variant="ghost" color="red" onClick={deleteDomain} disabled={isMutating}>
            <TrashIcon />
          </IconButton>
        </Flex>
      </Flex>
      {error ? <GenericErrorCallout title={`Failed to update ${domainSettings.domain}`} error={error} /> : null}
    </Flex>
  );
}

interface DomainSettingsItemsProps {
  isLoading: boolean;
  listError: ListDomainSettingsQueryError | undefined;
  domains: DomainSettingsSummary[];
}

function DomainSettingsItems({ isLoading, listError, domains }: DomainSettingsItemsProps) {
  if (isLoading) {
    return <XSpinner message="Loading domains..." />;
  }
  if (listError) {
    return <GenericErrorCallout title="Failed to fetch domains" error={listError} />;
  }
  if (domains.length === 0) {
    return (
      <Callout.Root color="gray" size="1">
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>No domains are listed yet.</Callout.Text>
      </Callout.Root>
    );
  }
  return (
    <Flex direction="column" gap="2">
      {domains.map((domainSettings) => (
        <DomainSettingsRow key={domainSettings.id} domainSettings={domainSettings} />
      ))}
    </Flex>
  );
}

export function DomainSettingsCard() {
  const [newDomain, setNewDomain] = useState('');
  const [domainError, setDomainError] = useState<string | null>(null);

  const { data, isLoading, error: listError } = useListDomainSettings();
  const {
    trigger: createDomainSettings,
    isMutating: isCreating,
    error: createError,
    reset: resetCreate,
  } = useCreateDomainSettings({
    swr: {
      onSuccess: async () => {
        setNewDomain('');
        await revalidateDomainSettings();
      },
    },
  });

  const pendingDomain = normalizeDomain(newDomain);
  const domains = data?.items ?? [];

  const addDomain = async () => {
    if (!DOMAIN_PATTERN.test(pendingDomain)) {
      setDomainError(`"${newDomain.trim()}" is not a valid domain. Enter a domain such as example.org.`);
      return;
    }
    setDomainError(null);
    await createDomainSettings({ domain: pendingDomain }, { throwOnError: false });
  };

  return (
    <SectionCard
      headerLeft={
        <Flex align="center" gap="2">
          <Heading size="3" wrap="nowrap">
            Domain Settings
          </Heading>
          <Tooltip content={DOMAINS_TOOLTIP}>
            <InfoCircledIcon />
          </Tooltip>
        </Flex>
      }
    >
      <Flex direction="column" gap="3">
        <Text size="2" color="gray">
          Settings for people whose email address is at a listed domain.
        </Text>
        <DomainSettingsItems isLoading={isLoading} listError={listError} domains={domains} />
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            await addDomain();
          }}
        >
          <Flex gap="2" align="center" maxWidth="420px">
            <Box flexGrow="1">
              <TextField.Root
                value={newDomain}
                onChange={(e) => {
                  setNewDomain(e.target.value);
                  setDomainError(null);
                  resetCreate();
                }}
                placeholder="example.org"
                disabled={isCreating}
              />
            </Box>
            <Button type="submit" variant="soft" disabled={pendingDomain === ''} loading={isCreating}>
              <PlusIcon />
              Add domain
            </Button>
          </Flex>
        </form>
        {domainError ? (
          <Text size="2" color="red">
            {domainError}
          </Text>
        ) : null}
        {createError ? <GenericErrorCallout title="Failed to add domain" error={createError} /> : null}
      </Flex>
    </SectionCard>
  );
}
