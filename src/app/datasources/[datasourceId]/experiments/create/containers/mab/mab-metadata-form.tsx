'use client';
import React from 'react';
import {
  Box,
  Card,
  Flex,
  Text,
  TextField,
  TextArea,
  Button,
  IconButton,
  CheckboxCards,
  Grid,
  Heading,
} from '@radix-ui/themes';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import {
  MABFormData,
  BanditArm,
  PriorType,
  OutcomeType,
  CMABFormData,
  Context,
} from '@/app/datasources/[datasourceId]/experiments/create/types';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { SectionCard } from '@/components/ui/cards/section-card';
import { useCreateExperiment } from '@/api/admin';
import { convertFormDataToCreateExperimentRequest } from '../../helpers';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { ContextType, WebhookSummary } from '@/api/methods.schemas';

interface MABMetadataFormProps {
  webhooks: WebhookSummary[];
  formData: MABFormData | CMABFormData;
  onFormDataChange: (data: MABFormData | CMABFormData) => void;
  onNext: () => void;
  onBack: () => void;
}

interface OutcomeOption {
  type: OutcomeType;
  title: string;
  description: string;
}

const OUTCOME_OPTIONS: OutcomeOption[] = [
  {
    type: 'binary',
    title: 'Binary',
    description:
      'Yes/No outcomes: conversions, clicks, sign-ups, purchases. Results are expressed as percentages or rates.',
  },
  {
    type: 'real-valued',
    title: 'Real-valued',
    description:
      'Continuous numeric outcomes: revenue per user, time spent, satisfaction scores, any measurable quantity.',
  },
];

interface ContextTypeOption {
  type: ContextType;
  title: string;
  description: string;
}

const CONTEXT_TYPE_OPTIONS: ContextTypeOption[] = [
  {
    type: 'binary',
    title: 'Binary',
    description: 'Yes/No outcomes: gender, adult or child, onboarded or not, etc.',
  },
  {
    type: 'real-valued',
    title: 'Real-valued',
    description: 'Continuous numeric outcomes: age, onboarding time, etc.',
  },
];

export function MABMetadataForm({ webhooks, formData, onFormDataChange, onNext, onBack }: MABMetadataFormProps) {
  const { trigger: triggerCreateExperiment, error: createExperimentError } = useCreateExperiment(
    formData.datasourceId!,
    {
      chosen_n: formData.chosenN!,
    },
  );

  const handleSaveExperiment = async () => {
    try {
      const request = convertFormDataToCreateExperimentRequest(formData);
      const response = await triggerCreateExperiment(request);
      onFormDataChange({
        ...formData,
        experimentId: response.design_spec.experiment_id!,
        createExperimentResponse: response,
      });
      onNext();
    } catch (error) {
      console.error('Error creating experiment:', error);
      throw new Error('Failed to create experiment');
    }
  };

  const updateBasicInfo = (field: keyof MABFormData, value: string) => {
    onFormDataChange({
      ...formData,
      [field]: value,
    });
  };

  const handleOutcomeChange = (outcomeType: OutcomeType) => {
    // Auto-map prior type based on outcome type for MAB
    const priorType: PriorType =
      formData.experimentType === 'mab_online' && outcomeType === 'binary' ? 'beta' : 'normal';

    // Update existing arms to have the correct prior parameters
    const updatedArms = formData.arms.map((arm) => {
      const baseArm = {
        arm_name: arm.arm_name,
        arm_description: arm.arm_description,
      };

      if (priorType === 'beta') {
        // Convert to beta parameters (or use defaults)
        return {
          ...baseArm,
          alpha_prior: arm.alpha_prior || 1,
          beta_prior: arm.beta_prior || 1,
          // Remove normal parameters
          mean_prior: undefined,
          stddev_prior: undefined,
        };
      } else {
        // Convert to normal parameters (or use defaults)
        return {
          ...baseArm,
          mean_prior: arm.mean_prior ?? 0,
          stddev_prior: arm.stddev_prior || 1,
          // Remove beta parameters
          alpha_prior: undefined,
          beta_prior: undefined,
        };
      }
    });

    const updatedData = {
      ...formData,
      outcomeType,
      priorType, // Automatically set based on outcome
      arms: updatedArms, // Update arms with correct parameters
    };
    onFormDataChange(
      formData.experimentType === 'mab_online' ? (updatedData as MABFormData) : (updatedData as CMABFormData),
    ); // Ensure type consistency
  };

  const updateContext = (index: number, updatedContext: Partial<Context>) => {
    const cmabFormData = formData as CMABFormData;
    const updatedContexts = cmabFormData.contexts.map((context, i) =>
      i === index ? { ...context, ...updatedContext } : context,
    );
    onFormDataChange({
      ...cmabFormData,
      contexts: updatedContexts,
    });
  };

  const addContext = (formData: CMABFormData) => {
    const newContext: Context = {
      name: '',
      description: '',
      type: 'real-valued',
    };
    onFormDataChange({
      ...formData,
      contexts: [...formData.contexts, newContext],
    });
  };

  const deleteContext = (index: number) => {
    const cmabFormData = formData as CMABFormData;
    if (cmabFormData.contexts.length <= 1) return; // Minimum 1 context required
    onFormDataChange({
      ...cmabFormData,
      contexts: cmabFormData.contexts.filter((_, i) => i !== index),
    });
  };

  const updateArm = (index: number, updatedArm: Partial<BanditArm>) => {
    const updatedArms = formData.arms.map((arm, i) => (i === index ? { ...arm, ...updatedArm } : arm));
    onFormDataChange({
      ...formData,
      arms: updatedArms,
    });
  };

  const addArm = () => {
    const newArm: BanditArm = {
      arm_name: '',
      arm_description: '',
    };

    // Add the correct prior parameters based on current priorType
    if (formData.priorType === 'beta') {
      newArm.alpha_prior = 1;
      newArm.beta_prior = 1;
    } else if (formData.priorType === 'normal') {
      newArm.mean_prior = 0;
      newArm.stddev_prior = 1;
    }

    onFormDataChange({
      ...formData,
      arms: [...formData.arms, newArm],
    });
  };

  const deleteArm = (index: number) => {
    if (formData.arms.length <= 2) return; // Minimum 2 arms required

    onFormDataChange({
      ...formData,
      arms: formData.arms.filter((_, i) => i !== index),
    });
  };

  const isPriorParamValid = (arm: BanditArm) => {
    if (!formData.priorType) return false; // Prior type must be set

    if (formData.priorType === 'beta') {
      return arm.alpha_prior !== undefined && arm.alpha_prior > 0 && arm.beta_prior !== undefined && arm.beta_prior > 0;
    } else if (formData.priorType === 'normal') {
      return arm.mean_prior !== undefined && arm.stddev_prior !== undefined && arm.stddev_prior > 0;
    }
    return false;
  };

  const isFormValid = () => {
    const basicValid =
      formData.name.trim() &&
      formData.hypothesis.trim() &&
      formData.priorType &&
      formData.outcomeType &&
      formData.arms.length >= 2 &&
      (formData.experimentType === 'cmab_online' ? formData.contexts.length >= 1 : true);
    const armsValid = formData.arms.every((arm) => arm.arm_name.trim() && isPriorParamValid(arm));

    return basicValid && armsValid;
  };

  return (
    <Flex direction="column" gap="4">
      {/* Basic Information */}
      <SectionCard title="Basic Information">
        <Flex direction="column" gap="3">
          <Flex gap="4">
            <Box width="100%">
              <Text as="label" size="2" weight="bold" mb="6px">
                Experiment Name
              </Text>
              <TextField.Root
                value={formData.name}
                onChange={(e) => updateBasicInfo('name', e.target.value)}
                placeholder="Enter experiment name"
              />
            </Box>
          </Flex>

          <Box>
            <Text as="label" size="2" weight="bold" mb="6px">
              Hypothesis
            </Text>
            <TextArea
              value={formData.hypothesis}
              onChange={(e) => updateBasicInfo('hypothesis', e.target.value)}
              placeholder="Describe your hypothesis..."
              style={{ minHeight: '80px' }}
            />
          </Box>

          <Flex gap="4">
            <Box>
              <Text as="label" size="2" weight="bold" mb="6px">
                Start Date
              </Text>
              <TextField.Root
                type="date"
                value={formData.startDate}
                onChange={(e) => updateBasicInfo('startDate', e.target.value)}
              />
            </Box>
            <Box>
              <Text as="label" size="2" weight="bold" mb="6px">
                End Date
              </Text>
              <TextField.Root
                type="date"
                value={formData.endDate}
                onChange={(e) => updateBasicInfo('endDate', e.target.value)}
              />
            </Box>
          </Flex>
        </Flex>
      </SectionCard>

      {/* Outcome Type */}
      <SectionCard title="Outcome Type">
        <Text size="2" color="gray" mb="20px">
          Define the type of outcome measured in this experiment. The prior distribution for each arm will be
          automatically selected based on your choice.
        </Text>
        <Text size="2" weight="medium" mb="12px" mt="12px" as="div">
          Select outcome type
        </Text>

        <Flex direction="column" gap="3">
          {OUTCOME_OPTIONS.map((option) => (
            <OutcomeOptionCard
              key={option.type}
              option={option}
              isSelected={formData.outcomeType === option.type}
              onSelect={() => handleOutcomeChange(option.type)}
            />
          ))}
        </Flex>
        {formData.priorType && formData.outcomeType && (
          <Box p="3">
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium" color="indigo">
                Selected Configuration: {formData.priorType === 'beta' ? 'Beta Distribution' : 'Normal Distribution'} ×{' '}
                {formData.outcomeType === 'binary' ? 'Binary' : 'Real-valued'} Outcome
              </Text>
              <Text size="2" color="gray" mt="4px" weight="medium">
                {formData.priorType === 'beta'
                  ? 'Using alpha (prior successes) and beta (prior failures) parameters. '
                  : 'Using mean and standard deviation parameters. '}
                You can set these parameters for each arm in the Arms section below.
              </Text>
            </Flex>
          </Box>
        )}
      </SectionCard>

      {/* Contexts */}
      {formData.experimentType === 'cmab_online' ? (
        <SectionCard title="Contexts">
          <Text size="2" color="gray" mb="20px">
            Define the context variables about the user that the algorithm will use to make personalized choices while
            assigning arms.
          </Text>
          <Flex direction="column" gap="3">
            {formData.contexts.map((context, index) => (
              <ContextCard
                key={index}
                context={context}
                contextIndex={index}
                canDelete={formData.contexts.length > 1}
                onUpdate={(updatedContext) => updateContext(index, updatedContext)}
                onDelete={() => deleteContext(index)}
              />
            ))}
            <Flex justify="center" mt="4">
              <Button onClick={() => addContext(formData as CMABFormData)} variant="outline">
                <PlusIcon />
                Add Context
              </Button>
            </Flex>
          </Flex>
        </SectionCard>
      ) : null}

      {/* Treatment Arms */}
      <SectionCard title="Arms">
        <Flex direction="column" gap="1">
          {!formData.priorType ||
            (!formData.outcomeType && (
              <Box p="3">
                <Text size="2" weight="medium" color="blue">
                  ⚠️ Prior distribution and outcome type must be selected in the Design step first
                </Text>
              </Box>
            ))}
        </Flex>

        <Flex direction="column" gap="3">
          {formData.arms.map((arm, index) => (
            <ArmCard
              key={index}
              arm={arm}
              armIndex={index}
              priorType={formData.priorType}
              canDelete={formData.arms.length > 2}
              onUpdate={(updatedArm) => updateArm(index, updatedArm)}
              onDelete={() => deleteArm(index)}
            />
          ))}

          <Flex justify="center" mt="4">
            <Button onClick={addArm} variant="outline">
              <PlusIcon />
              Add Arm
            </Button>
          </Flex>
        </Flex>
      </SectionCard>

      {webhooks.length > 0 && (
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="4">Webhooks</Heading>
            <Text size="2" color="gray">
              Select which webhooks should receive notifications when this experiment is created.
            </Text>
            <CheckboxCards.Root
              value={formData.selectedWebhookIds}
              onValueChange={(value) => onFormDataChange({ ...formData, selectedWebhookIds: value })}
            >
              <Grid columns="4" gap="3">
                {webhooks.map((webhook) => (
                  <CheckboxCards.Item key={webhook.id} value={webhook.id}>
                    <Flex direction="column" width="100%">
                      <Text weight="bold">{webhook.name}</Text>
                      <Text>{webhook.url}</Text>
                    </Flex>
                  </CheckboxCards.Item>
                ))}
              </Grid>
            </CheckboxCards.Root>
          </Flex>
        </Card>
      )}

      {createExperimentError && (
        <GenericErrorCallout title="Failed to create experiment" error={createExperimentError} />
      )}

      <NavigationButtons onBack={onBack} onNext={handleSaveExperiment} nextLabel="Next" nextDisabled={!isFormValid()} />
    </Flex>
  );
}

interface OutcomeOptionCardProps {
  option: OutcomeOption;
  isSelected: boolean;
  onSelect: () => void;
}

function OutcomeOptionCard({ option, isSelected, onSelect }: OutcomeOptionCardProps) {
  return (
    <Card
      size="2"
      onClick={onSelect}
      asChild
      style={isSelected ? { border: '2px solid var(--accent-9)', backgroundColor: 'var(--accent-2)' } : {}}
    >
      <Box as="div">
        <Flex direction="column" gap="1">
          <Text size="2" weight="bold">
            {option.title}
          </Text>
          <Text size="1" color="gray">
            {option.description}
          </Text>
        </Flex>
      </Box>
    </Card>
  );
}

interface ContextCardProps {
  context: Context;
  contextIndex: number;
  canDelete: boolean;
  onUpdate: (updatedContext: Partial<Context>) => void;
  onDelete: () => void;
}

function ContextCard({ context, contextIndex, canDelete, onUpdate, onDelete }: ContextCardProps) {
  return (
    <Card>
      {/* Header */}
      <Flex direction="column" gap="2">
        <Flex align="center" justify="between">
          <Text weight="bold" size="3">
            {`Context ${contextIndex + 1}`}
          </Text>
          <IconButton onClick={onDelete} disabled={!canDelete} color="red" variant="soft" size="1">
            <TrashIcon />
          </IconButton>
        </Flex>
      </Flex>

      {/* Content */}
      <Flex direction="column" gap="1">
        <Box maxWidth={'50%'}>
          <Text as="label" size="2" weight="bold">
            Context Name
          </Text>
          <TextField.Root
            value={context.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Context Name"
            required
            mb="3"
          />
        </Box>
      </Flex>
      <Flex direction="column" gap="1">
        <Text as="label" size="2" weight="bold">
          Context Description
        </Text>
        <TextArea
          value={context.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Context Description"
          required
          mb="3"
        />
      </Flex>
      <Flex direction="column" gap="1">
        <Text as="label" size="2" weight="bold">
          Context Variable Type
        </Text>
        <Flex direction="row" gap="1">
          {CONTEXT_TYPE_OPTIONS.map((option) => (
            <Card
              key={option.type}
              onClick={() => onUpdate({ type: option.type })}
              asChild
              style={
                context.type === option.type
                  ? { border: '2px solid var(--accent-9)', backgroundColor: 'var(--accent-2)', width: '35%' }
                  : { width: '35%' }
              }
            >
              <Box as="div">
                <Flex direction="column" gap="1">
                  <Text size="2" weight="bold">
                    {option.title}
                  </Text>
                  <Text size="1" weight="regular">
                    {option.description}
                  </Text>
                </Flex>
              </Box>
            </Card>
          ))}
        </Flex>
      </Flex>
    </Card>
  );
}

interface ArmCardProps {
  arm: BanditArm;
  armIndex: number;
  priorType: PriorType;
  canDelete: boolean;
  onUpdate: (updatedArm: Partial<BanditArm>) => void;
  onDelete: () => void;
}

function ArmCard({ arm, armIndex, priorType, canDelete, onUpdate, onDelete }: ArmCardProps) {
  return (
    <Card>
      {/* Header */}
      <Flex direction="column" gap="2">
        <Flex align="center" justify="between">
          <Text weight="bold" size="3">
            {armIndex === 0 ? `Arm ${armIndex + 1} (control)` : `Arm ${armIndex + 1}`}
          </Text>
          <IconButton onClick={onDelete} disabled={!canDelete} color="red" variant="soft" size="1">
            <TrashIcon />
          </IconButton>
        </Flex>
        {/* Content */}
        <Flex direction="column" gap="2">
          <Box maxWidth={'50%'}>
            <Text as="label" size="2" weight="bold">
              Arm Name
            </Text>
            <TextField.Root
              value={arm.arm_name}
              onChange={(e) => onUpdate({ arm_name: e.target.value })}
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
            onChange={(e) => onUpdate({ arm_description: e.target.value })}
            placeholder="Arm Description"
            mb="2"
          />
        </Flex>
        <Flex direction="column" gap="4">
          {!priorType && (
            <Box p="3">
              <Text size="2" color="orange">
                Select prior distribution in Design step first
              </Text>
            </Box>
          )}

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
                  onChange={(e) => onUpdate({ alpha_prior: Number(e.target.value) })}
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
                  onChange={(e) => onUpdate({ beta_prior: Number(e.target.value) })}
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
                  value={arm.mean_prior ?? ''}
                  onChange={(e) => onUpdate({ mean_prior: e.target.value ? Number(e.target.value) : undefined })}
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
                  onChange={(e) => onUpdate({ stddev_prior: Number(e.target.value) })}
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
