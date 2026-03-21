'use client';

import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData, ExperimentScreenId } from '@/app/experiments/create/experiment-form/experiment-form-def';
import {
  Box,
  Button,
  Callout,
  Card,
  Flex,
  Heading,
  IconButton,
  Text,
  TextArea,
  TextField,
  SegmentedControl,
} from '@radix-ui/themes';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { InfoCircledIcon, Pencil2Icon, PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { useCreateExperiment, useListOrganizationDatasources } from '@/api/admin';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { convertToBanditCreateRequest } from '@/app/experiments/create/experiment-form/experiment-form-helpers';
import { CreateExperimentResponse } from '@/api/methods.schemas';
import { ErrorType } from '@/services/orval-fetch';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { XSpinner } from '@/components/ui/x-spinner';
import { BanditArm, PriorType } from '@/app/experiments/create/experiment-form/experiment-form-types';
import { ArmWeightsDialog } from '@/components/features/experiments/arm-weights-dialog';
import { useState } from 'react';

export type ExperimentDescribeBanditArmsMessage =
  | { type: 'add-arm' }
  | { type: 'remove-arm'; index: number }
  | { type: 'update-arm'; index: number; field: keyof BanditArm; value: string | number }
  | { type: 'set-weights'; weights: number[] }
  | { type: 'set-create-response'; response: CreateExperimentResponse }
  | { type: 'set-create-error'; response: ErrorType<unknown> }
  | { type: 'set-datasource-id'; datasourceId: string };

interface ArmCardProps {
  arm: BanditArm;
  armIndex: number;
  priorType: PriorType;
  showPriors: boolean;
  canDelete: boolean;
  onUpdate: (field: keyof BanditArm, value: string | number) => void;
  onDelete: () => void;
}

function ArmCard({ arm, armIndex, priorType, showPriors, canDelete, onUpdate, onDelete }: ArmCardProps) {
  return (
    <Card>
      <Flex direction="column" gap="2">
        <Flex align="center" justify="between">
          <Text weight="bold" size="3">
            {`Arm ${armIndex + 1}`}
          </Text>
          <IconButton onClick={onDelete} disabled={!canDelete} color="red" variant="soft" size="1">
            <TrashIcon />
          </IconButton>
        </Flex>

        <Flex direction="column" gap="2">
          <Box maxWidth={'50%'}>
            <Text as="label" size="2" weight="bold">
              Arm Name
            </Text>
            <TextField.Root
              value={arm.arm_name}
              onChange={(e) => onUpdate('arm_name', e.target.value)}
              placeholder="Arm Name"
              required
              mb="2"
            />
          </Box>
        </Flex>

        <Flex direction="column" gap="2">
          <Text as="label" size="2" weight="bold">
            Arm Description
          </Text>
          <TextArea
            value={arm.arm_description || ''}
            onChange={(e) => onUpdate('arm_description', e.target.value)}
            placeholder="Arm Description"
            mb="2"
          />
        </Flex>

        {showPriors && (
          <Flex direction="column" gap="4">
            {priorType === 'beta' && (
              <Flex gap="3">
                <Box>
                  <Text as="label" size="2" weight="bold" mb="6px">
                    Prior successes (alpha)
                  </Text>
                  <TextField.Root
                    type="number"
                    min="1"
                    value={arm.alpha_prior ? arm.alpha_prior.toString() : '1'}
                    onChange={(e) => onUpdate('alpha_prior', Number(e.target.value))}
                    placeholder="1"
                  />
                </Box>
                <Box>
                  <Text as="label" size="2" weight="bold" mb="6px">
                    Prior failures (beta)
                  </Text>
                  <TextField.Root
                    type="number"
                    min="1"
                    value={arm.beta_prior ? arm.beta_prior.toString() : '1'}
                    onChange={(e) => onUpdate('beta_prior', Number(e.target.value))}
                    placeholder="1"
                  />
                </Box>
              </Flex>
            )}

            {priorType === 'normal' && (
              <Flex gap="3">
                <Box maxWidth={'30%'}>
                  <Text as="label" size="2" weight="bold" mb="6px">
                    Prior Mean
                  </Text>
                  <TextField.Root
                    type="number"
                    value={arm.mean_prior ? arm.mean_prior.toString() : '0'}
                    onChange={(e) => onUpdate('mean_prior', e.target.value ? Number(e.target.value) : 0)}
                    placeholder="0"
                  />
                </Box>
                <Box maxWidth={'30%'}>
                  <Text as="label" size="2" weight="bold" mb="6px">
                    Prior Standard Deviation
                  </Text>
                  <TextField.Root
                    type="number"
                    value={arm.stddev_prior ? arm.stddev_prior.toString() : '1'}
                    onChange={(e) => onUpdate('stddev_prior', e.target.value ? Number(e.target.value) : 1)}
                    placeholder="1"
                  />
                </Box>
              </Flex>
            )}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

const isPriorParamValid = (arm: BanditArm, priorType: PriorType) => {
  if (priorType === 'beta') {
    return arm.alpha_prior !== undefined && arm.alpha_prior > 0 && arm.beta_prior !== undefined && arm.beta_prior > 0;
  }
  if (priorType === 'normal') {
    return arm.mean_prior !== undefined && arm.stddev_prior !== undefined && arm.stddev_prior > 0;
  }
  return false;
};

const getValidationMessage = (data: ExperimentFormData, showPriors: boolean) => {
  if (data.bandit === undefined) return 'Bandit configuration is required.';
  const arms = data.bandit.arms;
  const priorType = data.bandit.priorType;

  if (arms.length < 2) return 'At least 2 arms are required.';
  if (arms.length > 10) return 'Maximum 10 arms allowed.';

  for (let i = 0; i < arms.length; i++) {
    const arm = arms[i];
    if (!arm.arm_name?.trim()) return `Arm ${i + 1} name is required.`;
    if (showPriors && !isPriorParamValid(arm, priorType)) return `Arm ${i + 1} has invalid prior parameters.`;
  }
  return '';
};

const isFormValid = (data: ExperimentFormData, showPriors: boolean) => getValidationMessage(data, showPriors) === '';

export const ExperimentDescribeBanditArmsScreen = ({
  data,
  dispatch,
  navigatePrev,
  navigateNext,
}: ScreenProps<ExperimentFormData, ExperimentDescribeBanditArmsMessage, ExperimentScreenId>) => {
  const orgContext = useCurrentOrganization();
  const organizationId = orgContext!.current.id;

  // Fetch datasources
  const { data: datasourcesData, isLoading: datasourcesLoading } = useListOrganizationDatasources(organizationId, {
    swr: { enabled: !!organizationId },
  });

  // Find the NoDWH datasource (driver === 'none')
  // If it doesn't exist, fall back to the first datasource in the list (if any)
  let datasource;
  const noDwhDatasource = datasourcesData?.items?.find((ds) => ds.driver === 'none');
  if (noDwhDatasource) {
    datasource = noDwhDatasource;
  } else {
    datasource = datasourcesData?.items[0];
  }
  const datasourceId = datasource?.id ?? '';

  const { trigger: triggerCreate, isMutating: createLoading } = useCreateExperiment(
    datasourceId,
    { desired_n: 0 },
    {
      swr: {
        onSuccess: async (response) => {
          dispatch({ type: 'set-datasource-id', datasourceId: datasourceId });
          dispatch({ type: 'set-create-response', response });
          navigateNext();
        },
        onError: async (response: ErrorType<unknown>) => {
          dispatch({ type: 'set-create-error', response });
        },
      },
    },
  );

  const [showPriors, setShowPriors] = useState(false);

  const arms = data.bandit?.arms ?? [];
  const priorType = data.bandit?.priorType ?? 'normal';
  const outcomeType = data.bandit?.outcomeType;
  const formValid = isFormValid(data, showPriors);

  const handleCreate = async () => {
    if (!datasourceId) {
      console.error('No NoDWH datasource found');
      return;
    }
    if (!isFormValid(data, showPriors)) {
      return;
    }
    const request = convertToBanditCreateRequest(data);
    await triggerCreate(request, { throwOnError: false });
  };

  const handleModeChange = (value: string) => {
    if (value === 'priors') {
      setShowPriors(true);
      dispatch({ type: 'set-weights', weights: [] });
      for (let i = 0; i < arms.length; i++) {
        dispatch({ type: 'update-arm', index: i, field: 'alpha_prior', value: 1 });
        dispatch({ type: 'update-arm', index: i, field: 'beta_prior', value: 1 });
        dispatch({ type: 'update-arm', index: i, field: 'mean_prior', value: 0 });
        dispatch({ type: 'update-arm', index: i, field: 'stddev_prior', value: 1 });
      }
    } else if (value === 'weights') {
      setShowPriors(false);
      dispatch({ type: 'set-weights', weights: [50, 50] });
      for (let i = 0; i < arms.length; i++) {
        dispatch({ type: 'update-arm', index: i, field: 'alpha_prior', value: '' });
        dispatch({ type: 'update-arm', index: i, field: 'beta_prior', value: '' });
        dispatch({ type: 'update-arm', index: i, field: 'mean_prior', value: '' });
        dispatch({ type: 'update-arm', index: i, field: 'stddev_prior', value: '' });
      }
    }
  };

  if (datasourcesLoading) {
    return (
      <Flex direction="column" gap="3">
        <XSpinner />
      </Flex>
    );
  }

  if (!datasource) {
    return (
      <Flex direction="column" gap="3">
        <GenericErrorCallout title="Configuration error" message="No NoDWH datasource found. Please contact support." />
      </Flex>
    );
  }

  const showArmsError = arms.length > 0 && arms.length < 2;

  return (
    <>
      <Flex direction="column" gap={'3'}>
        <Flex justify="between" align="start">
          <Flex direction="column" gap="1">
            <Heading size="4">Arms</Heading>
            {showArmsError && (
              <Text size="1" color="red">
                At least two arms are required
              </Text>
            )}
          </Flex>
          <Flex gap="2">
            <SegmentedControl.Root
              size="1"
              variant="surface"
              value={showPriors ? 'priors' : 'weights'}
              onValueChange={(value) => handleModeChange(value)}
            >
              <SegmentedControl.Item value="priors">Edit Priors</SegmentedControl.Item>
              <SegmentedControl.Item value="weights">
                <Flex gap="1" align="center">
                  Edit Weights
                </Flex>
              </SegmentedControl.Item>
            </SegmentedControl.Root>
            <ArmWeightsDialog
              arms={arms}
              onWeightsChange={(weights) => dispatch({ type: 'set-weights', weights })}
              disabled={showPriors}
              button_text=""
            />
          </Flex>
        </Flex>

        {/* Prior configuration info */}
        <Callout.Root>
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            Using {priorType === 'beta' ? 'Beta' : 'Normal'} distribution for{' '}
            {outcomeType === 'binary' ? 'binary' : 'real-valued'} outcomes.
          </Callout.Text>
        </Callout.Root>

        <Flex direction="column" gap="3">
          {arms.map((arm, index) => (
            <ArmCard
              key={index}
              arm={arm}
              armIndex={index}
              priorType={priorType}
              showPriors={showPriors}
              canDelete={arms.length > 2}
              onUpdate={(field, value) => dispatch({ type: 'update-arm', index, field, value })}
              onDelete={() => dispatch({ type: 'remove-arm', index })}
            />
          ))}
          {arms.length < 10 && (
            <Flex justify="center" mt="4">
              <Button onClick={() => dispatch({ type: 'add-arm' })} variant="outline">
                <PlusIcon />
                Add Arm
              </Button>
            </Flex>
          )}
        </Flex>
      </Flex>

      {data.createExperimentError && (
        <GenericErrorCallout title="Failed to create experiment" error={data.createExperimentError} />
      )}

      <NavigationButtons
        onPrev={navigatePrev}
        onNext={handleCreate}
        nextDisabled={!formValid}
        nextLoading={createLoading}
        nextTooltipContent={getValidationMessage(data, showPriors)}
      />
    </>
  );
};
