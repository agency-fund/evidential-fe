'use client';
import { Button, Checkbox, Flex, Text } from '@radix-ui/themes';
import { UpdateIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { mutate } from 'swr';
import { getGetExperimentForUiKey, useUpdateBanditArmsForUi } from '@/api/admin';

interface UpdateBanditArmsButtonProps {
  datasourceId: string;
  experimentId: string;
}

export function UpdateBanditArmsButton({ datasourceId, experimentId }: UpdateBanditArmsButtonProps) {
  const [fromInitialPrior, setFromInitialPrior] = useState(false);
  const [updated, setUpdated] = useState(false);

  const { trigger, isMutating, error } = useUpdateBanditArmsForUi(
    datasourceId,
    experimentId,
    { update_from_initial_prior: fromInitialPrior },
    {
      swr: {
        onSuccess: async () => {
          setUpdated(true);
          await mutate(getGetExperimentForUiKey(datasourceId, experimentId));
        },
      },
    },
  );

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
      <Text as="label" size="1">
        <Flex gap="1" align="center">
          <Checkbox
            size="1"
            checked={fromInitialPrior}
            disabled={isMutating}
            onCheckedChange={(checked) => setFromInitialPrior(checked === true)}
          />
          Start from prior
        </Flex>
      </Text>
      {status ? (
        <Text size="1" color={status.color}>
          {status.text}
        </Text>
      ) : null}
    </Flex>
  );
}
