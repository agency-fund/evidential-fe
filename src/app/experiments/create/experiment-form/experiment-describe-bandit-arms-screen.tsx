'use client';

import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData, ExperimentScreenId } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { Box, Button, Callout, Card, Flex, Heading, IconButton, Text, TextArea, TextField } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { InfoCircledIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { useCreateExperiment, useListOrganizationDatasources } from '@/api/admin';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { convertToBanditCreateRequest } from '@/app/experiments/create/experiment-form/experiment-form-helpers';
import { CreateExperimentResponse } from '@/api/methods.schemas';
import { ErrorType } from '@/services/orval-fetch';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { XSpinner } from '@/components/ui/x-spinner';
import { BanditArm, PriorType } from '@/app/experiments/create/experiment-form/experiment-form-types';

export type ExperimentDescribeBanditArmsMessage =
  | { type: 'add-arm' }
  | { type: 'remove-arm'; index: number }
  | { type: 'update-arm'; index: number; field: keyof BanditArm; value: string | number }
  | { type: 'set-create-response'; response: CreateExperimentResponse }
  | { type: 'set-create-error'; response: ErrorType<unknown> }
  | { type: 'set-datasource-id'; datasourceId: string };

interface ArmCardProps {
  arm: BanditArm;
  armIndex: number;
  priorType: PriorType;
  canDelete: boolean;
  onUpdate: (field: keyof BanditArm, value: string | number) => void;
  onDelete: () => void;
}

function ArmCard({ arm, armIndex, priorType, canDelete, onUpdate, onDelete }: ArmCardProps) {
  return (
    <Card>
      <Flex direction="column" gap="2">
        <Flex align="center" justify="between">
          <Text weight="bold" size="3">
            {armIndex === 0 ? `Arm ${armIndex + 1} (control)` : `Arm ${armIndex + 1}`}
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

        <Flex direction="column" gap="4">
          {priorType === 'beta' && (
            <Flex gap="3">
              <Box>
                <Text as="label" size="2" weight="bold" mb="6px">
                  Alpha Prior
                </Text>
                <TextField.Root
                  type="number"
                  min="1"
                  value={arm.alpha_prior?.toString() || '1'}
                  onChange={(e) => onUpdate('alpha_prior', Number(e.target.value))}
                  placeholder="Prior successes"
                />
              </Box>
              <Box>
                <Text as="label" size="2" weight="bold" mb="6px">
                  Beta Prior
                </Text>
                <TextField.Root
                  type="number"
                  min="1"
                  value={arm.beta_prior?.toString() || '1'}
                  onChange={(e) => onUpdate('beta_prior', Number(e.target.value))}
                  placeholder="Prior failures"
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
                  value={arm.mean_prior !== undefined ? String(arm.mean_prior) : '0'}
                  onChange={(e) => onUpdate('mean_prior', e.target.value ? Number(e.target.value) : 0)}
                  placeholder="Prior Mean"
                />
              </Box>
              <Box maxWidth={'30%'}>
                <Text as="label" size="2" weight="bold" mb="6px">
                  Prior Standard Deviation
                </Text>
                <TextField.Root
                  type="number"
                  value={arm.stddev_prior?.toString() || '1'}
                  onChange={(e) => onUpdate('stddev_prior', Number(e.target.value))}
                  placeholder="Prior Standard Deviation"
                />
              </Box>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}

const getPriorType = (data: ExperimentFormData): PriorType => {
  // MAB with binary outcome uses beta; everything else uses normal
  if (data.experimentType === 'mab_online' && data.outcomeType === 'binary') {
    return 'beta';
  }
  return 'normal';
};

const isPriorParamValid = (arm: BanditArm, priorType: PriorType) => {
  if (priorType === 'beta') {
    return arm.alpha_prior !== undefined && arm.alpha_prior > 0 && arm.beta_prior !== undefined && arm.beta_prior > 0;
  }
  if (priorType === 'normal') {
    return arm.mean_prior !== undefined && arm.stddev_prior !== undefined && arm.stddev_prior > 0;
  }
  return false;
};

const getValidationMessage = (data: ExperimentFormData) => {
  const arms = data.bandit_arms ?? [];
  const priorType = getPriorType(data);

  if (arms.length < 2) return 'At least 2 arms are required.';
  if (arms.length > 10) return 'Maximum 10 arms allowed.';

  for (let i = 0; i < arms.length; i++) {
    const arm = arms[i];
    if (!arm.arm_name?.trim()) return `Arm ${i + 1} name is required.`;
    if (!isPriorParamValid(arm, priorType)) return `Arm ${i + 1} has invalid prior parameters.`;
  }
  return '';
};

const isFormValid = (data: ExperimentFormData) => getValidationMessage(data) === '';

export const ExperimentDescribeBanditArmsScreen = ({
  data,
  dispatch,
  navigatePrev,
  navigateNext,
}: ScreenProps<ExperimentFormData, ExperimentDescribeBanditArmsMessage, ExperimentScreenId>) => {
  const orgContext = useCurrentOrganization();
  const organizationId = orgContext!.current.id;

  // Fetch datasources to find the NoDWH datasource
  const { data: datasourcesData, isLoading: datasourcesLoading } = useListOrganizationDatasources(organizationId, {
    swr: { enabled: !!organizationId },
  });

  // Find the NoDWH datasource (driver === 'none')
  const noDwhDatasource = datasourcesData?.items?.find((ds) => ds.driver === 'none');
  const datasourceId = noDwhDatasource?.id ?? '';

  const {
    trigger: triggerCreate,
    isMutating: createLoading,
    error: createError,
  } = useCreateExperiment(
    datasourceId,
    { chosen_n: 0 },
    {
      swr: {
        onSuccess: async (response) => {
          dispatch({ type: 'set-datasource-id', datasourceId: datasourceId });
          dispatch({ type: 'set-create-response', response });
        },
        onError: async (response: ErrorType<unknown>) => {
          dispatch({ type: 'set-create-error', response });
        },
      },
    },
  );

  const arms = data.bandit_arms ?? [];
  const priorType = getPriorType(data);
  const formValid = isFormValid(data);

  const handleCreate = async () => {
    if (!datasourceId) {
      console.error('No NoDWH datasource found');
      return;
    }
    try {
      const request = convertToBanditCreateRequest(data);
      await triggerCreate(request);
    } catch {
      // handled by onError
    }
    navigateNext();
  };

  if (datasourcesLoading) {
    return (
      <Flex direction="column" gap="3">
        <WizardBreadcrumbs />
        <XSpinner />
      </Flex>
    );
  }

  if (!noDwhDatasource) {
    return (
      <Flex direction="column" gap="3">
        <WizardBreadcrumbs />
        <GenericErrorCallout title="Configuration error" message="No NoDWH datasource found. Please contact support." />
      </Flex>
    );
  }

  return (
    <>
      <Flex direction="column" gap={'3'}>
        <WizardBreadcrumbs />
        <Heading as="h2" size="4">
          Define Treatment Arms
        </Heading>
        <Text size="2" color="gray">
          Define the treatment arms for your experiment. Each arm can have its own prior parameters.
        </Text>

        {/* Prior configuration info */}
        <Callout.Root>
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            Using {priorType === 'beta' ? 'Beta' : 'Normal'} distribution for{' '}
            {data.outcomeType === 'binary' ? 'binary' : 'real-valued'} outcomes.
          </Callout.Text>
        </Callout.Root>

        <Flex direction="column" gap="3">
          {arms.map((arm, index) => (
            <ArmCard
              key={index}
              arm={arm}
              armIndex={index}
              priorType={priorType}
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

        {(createError || data.createExperimentError) && (
          <GenericErrorCallout title="Failed to create experiment" error={createError || data.createExperimentError} />
        )}
      </Flex>
      <NavigationButtons
        onBack={navigatePrev}
        onNext={handleCreate}
        nextDisabled={!formValid}
        nextLoading={createLoading}
        nextTooltipContent={getValidationMessage(data)}
      />
    </>
  );
};
