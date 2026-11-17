'use client';
import { Flex, Heading, Text } from '@radix-ui/themes';
import { useGetServerSettings } from '@/api/admin';
import RequirePrivileged from '@/components/require-privileged';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { XSpinner } from '@/components/ui/x-spinner';
import { SignupSettingsCard } from '@/components/features/settings/signup-settings-card';
import { DomainSettingsCard } from '@/components/features/settings/domain-settings-card';
import { formatIsoDateTimeLocal } from '@/services/date-utils';

function ServerSettings() {
  const { data: settings, isLoading, error } = useGetServerSettings();

  if (isLoading) {
    return <XSpinner message="Loading server settings..." />;
  }
  if (error) {
    return <GenericErrorCallout title="Failed to fetch server settings" error={error} />;
  }
  if (!settings) {
    return null;
  }

  return (
    <Flex direction="column" gap="4">
      <Flex direction="column" gap="1">
        <Heading size="8">Evidential Settings</Heading>
        <Text size="2" color="gray">
          These settings apply to this installation of Evidential.{' '}
          {settings.updated_at
            ? `Last changed on ${formatIsoDateTimeLocal(settings.updated_at)}.`
            : 'They have not been changed from their defaults.'}
        </Text>
      </Flex>

      <SignupSettingsCard key={settings.updated_at ?? 'defaults'} settings={settings.signup} />
      <DomainSettingsCard />
    </Flex>
  );
}

export default function Page() {
  return (
    <RequirePrivileged>
      <ServerSettings />
    </RequirePrivileged>
  );
}
