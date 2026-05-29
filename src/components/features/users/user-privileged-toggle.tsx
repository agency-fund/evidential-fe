'use client';
import { Flex, Switch, Text, Tooltip } from '@radix-ui/themes';
import { usePatchUser } from '@/api/admin';
import { GetUserResponse } from '@/api/methods.schemas';
import { useAuth } from '@/providers/auth-provider';
import { GenericErrorCallout } from '@/components/ui/generic-error';

interface UserPrivilegedToggleProps {
  user: GetUserResponse;
}

const SELF_REVOKE_TOOLTIP = 'You cannot change your own privileged status.';

export function UserPrivilegedToggle({ user }: UserPrivilegedToggleProps) {
  const auth = useAuth();
  const isSelf = auth.isAuthenticated && auth.userEmail === user.email;
  const { trigger, isMutating, error } = usePatchUser(user.id);

  const handleToggle = async (next: boolean) => {
    try {
      await trigger(
        { is_privileged: next },
        {
          optimisticData: { ...user, is_privileged: next },
          rollbackOnError: true,
        },
      );
    } catch {
      // Surfaced via the error state from usePatchUser.
    }
  };

  const switchEl = (
    <Switch checked={user.is_privileged} onCheckedChange={handleToggle} disabled={isMutating || isSelf} />
  );

  return (
    <Flex direction="column" gap="2">
      {error && <GenericErrorCallout title="Failed to update privileged status" error={error as Error} />}
      <Flex align="center" gap="3">
        {isSelf ? <Tooltip content={SELF_REVOKE_TOOLTIP}>{switchEl}</Tooltip> : switchEl}
        <Text size="2" color="gray">
          Privileged users can manage all users and organizations.
        </Text>
      </Flex>
    </Flex>
  );
}
