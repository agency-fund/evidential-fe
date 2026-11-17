'use client';
import { useState } from 'react';
import { Box, Button, Card, Flex, Heading, Text, TextField } from '@radix-ui/themes';
import { useCreateOrganizations } from '@/api/admin';
import { useAuth } from '@/providers/auth-provider';
import { invalidatePath } from '@/services/swr-cache';
import { defaultOrganizationName } from '@/services/organization-utils';
import { GenericErrorCallout } from '@/components/ui/generic-error';

const MAX_LENGTH_OF_NAME_VALUE = 100;

/**
 * Welcomes a user who is not yet a member of any organization and invites them to name their first one.
 *
 * Users who are already a member of an organization (e.g. because a colleague added them before their first login)
 * never see this.
 */
export function FirstOrganizationScreen() {
  const auth = useAuth();
  const userEmail = auth.isAuthenticated ? auth.userEmail : '';
  const [name, setName] = useState(() => (userEmail ? defaultOrganizationName(userEmail) : ''));

  const { trigger, isMutating, error } = useCreateOrganizations({
    swr: {
      // Refetching the organizations list is what dismisses this screen: OrganizationProvider stops rendering it once
      // the user has an organization.
      onSuccess: () => invalidatePath('/v1/m/organizations'),
    },
  });

  const trimmedName = name.trim();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!trimmedName) {
      return;
    }
    await trigger({ name: trimmedName }, { throwOnError: false });
  };

  return (
    <Flex direction="column" align="center" py="9" px="4">
      <Box width="100%" maxWidth="520px">
        <Card size="4">
          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="4">
              <Flex direction="column" gap="2">
                <Heading size="7">Welcome to Evidential.</Heading>
                <Text size="3" color="gray">
                  Let&apos;s set up your organization. Organizations are shared workspaces where your team runs
                  experiments. Each has its own data sources, access controls, and integrations.
                </Text>
              </Flex>

              {error ? <GenericErrorCallout title="Failed to create organization" error={error} /> : null}

              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Organization name
                </Text>
                <TextField.Root
                  size="3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter organization name"
                  maxLength={MAX_LENGTH_OF_NAME_VALUE}
                  disabled={isMutating}
                  autoFocus
                  required
                />
                <Text as="div" size="1" color="gray" mt="1">
                  You can change this at any time in Settings.
                </Text>
              </label>

              <Flex justify="between" align="center" gap="3">
                <Text size="1" color="gray">
                  {userEmail ? `Signed in as ${userEmail}` : null}
                </Text>
                <Button type="submit" size="3" loading={isMutating} disabled={!trimmedName}>
                  Continue
                </Button>
              </Flex>
            </Flex>
          </form>
        </Card>
      </Box>
    </Flex>
  );
}
