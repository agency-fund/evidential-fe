'use client';
import { Button, Flex, Text } from '@radix-ui/themes';
import { UpdateIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { mutate } from 'swr';
import { getGetExperimentForUiKey, useUpdateBanditArmsForUi } from '@/api/admin';

interface UpdateBanditArmsButtonProps {
  datasourceId: string;
  experimentId: string;
}

export function UpdateBanditArmsButton({ datasourceId, experimentId }: UpdateBanditArmsButtonProps) {
  const [updated, setUpdated] = useState(false);

  // No query params: the backend defaults to an incremental update (update_from_initial_prior=false).
  const { trigger, isMutating, error } = useUpdateBanditArmsForUi(datasourceId, experimentId, undefined, {
    swr: {
      onSuccess: async () => {
        setUpdated(true);
        await mutate(getGetExperimentForUiKey(datasourceId, experimentId));
      },
    },
  });

  const status = error
    ? { text: 'Update failed.', color: 'red' as const }
    : updated
      ? { text: 'Arms updated.', color: 'green' as const }
      : null;

  const handleClick = async () => {
    setUpdated(false);
    await trigger(undefined, { throwOnError: false });
  };

  return (
    <Flex align="center" gap="2">
      <Button variant="soft" color="blue" size="2" loading={isMutating} onClick={handleClick}>
        <UpdateIcon width="16" height="16" />
        Manually Update Arms
      </Button>
      {status ? (
        <Text size="1" color={status.color}>
          {status.text}
        </Text>
      ) : null}
    </Flex>
  );
}
