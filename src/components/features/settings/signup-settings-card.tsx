'use client';
import { useState } from 'react';
import { Flex, Heading, RadioGroup, Text, Tooltip } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { mutate } from 'swr';
import { getGetServerSettingsKey, useUpdateServerSettings } from '@/api/admin';
import { SignupSettings } from '@/api/methods.schemas';
import { SectionCard } from '@/components/ui/cards/section-card';
import { GenericErrorCallout } from '@/components/ui/generic-error';

type SignupMode = SignupSettings['mode'];

const SIGNUP_TOOLTIP =
  'New users are not privileged, and are asked to name their own organization when they arrive. Existing users are not affected by this setting.';

const MODE_OPTIONS: { value: SignupMode; label: string; description: string }[] = [
  {
    value: 'existing',
    label: 'Invited users only',
    description: 'Only people who have been invited by an administrator or an organization member can sign in.',
  },
  {
    value: 'existing_and_domains',
    label: 'Invited users and users in the configured domains',
    description: 'Invited users and users in the domains configured below can sign in.',
  },
  {
    value: 'anyone',
    label: 'Anyone',
    description: 'Anyone can sign in.',
  },
];

export function SignupSettingsCard({ settings }: { settings: SignupSettings }) {
  const [mode, setMode] = useState<SignupMode>(settings.mode);

  const { trigger, isMutating, error } = useUpdateServerSettings({
    swr: {
      onSuccess: async () => {
        await mutate(getGetServerSettingsKey());
      },
      onError: () => setMode(settings.mode),
    },
  });

  const changeMode = async (value: string) => {
    const next = value as SignupMode;
    setMode(next);
    await trigger({ signup: { mode: next } }, { throwOnError: false });
  };

  return (
    <SectionCard
      headerLeft={
        <Flex align="center" gap="2">
          <Heading size="3" wrap="nowrap">
            Sign-Up Policy
          </Heading>
          <Tooltip content={SIGNUP_TOOLTIP}>
            <InfoCircledIcon />
          </Tooltip>
        </Flex>
      }
    >
      <Flex direction="column" gap="4">
        <Text size="2" color="gray">
          Controls who we allow to sign up for Evidential.
        </Text>

        {error ? <GenericErrorCallout title="Failed to save sign-up settings" error={error} /> : null}

        <RadioGroup.Root value={mode} onValueChange={changeMode} disabled={isMutating}>
          <Flex direction="column" gap="3">
            {MODE_OPTIONS.map((option) => (
              <RadioGroup.Item key={option.value} value={option.value}>
                <Flex direction="column">
                  <Text weight="bold">{option.label}</Text>
                  <Text size="2" color="gray">
                    {option.description}
                  </Text>
                </Flex>
              </RadioGroup.Item>
            ))}
          </Flex>
        </RadioGroup.Root>
      </Flex>
    </SectionCard>
  );
}
