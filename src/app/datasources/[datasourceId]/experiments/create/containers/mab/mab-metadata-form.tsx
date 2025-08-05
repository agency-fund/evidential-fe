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
import { MABFormData, MABArm } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { SectionCard } from '@/components/ui/cards/section-card';
import { useCreateExperiment } from '@/api/admin';
import { convertFormDataToCreateExperimentRequest } from '../../helpers';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { WebhookSummary } from '@/api/methods.schemas';


interface MABMetadataFormProps {
  webhooks: WebhookSummary[];
  formData: MABFormData;
  onFormDataChange: (data: MABFormData) => void;
  onNext: () => void;
  onBack: () => void;
}

export function MABMetadataForm({
  webhooks,
  formData,
  onFormDataChange,
  onNext,
  onBack
}: MABMetadataFormProps) {

  const {
      trigger: triggerCreateExperiment,
      error: createExperimentError,
    } = useCreateExperiment(formData.datasourceId!, {
      chosen_n: formData.chosenN!,
    });

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

  const updateArm = (index: number, updatedArm: Partial<MABArm>) => {
    const updatedArms = formData.arms.map((arm, i) =>
      i === index ? { ...arm, ...updatedArm } : arm
    );
    onFormDataChange({
      ...formData,
      arms: updatedArms,
    });
  };

  const addArm = () => {
    const newArm: MABArm = {
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

  const isPriorParamValid = (arm: MABArm) => {
    if (!formData.priorType) return false; // Prior type must be set

    if (formData.priorType === 'beta') {
      return arm.alpha_prior !== undefined && arm.alpha_prior > 0 &&
             arm.beta_prior !== undefined && arm.beta_prior > 0;
    } else if (formData.priorType === 'normal') {
      return arm.mean_prior !== undefined &&
             arm.stddev_prior !== undefined && arm.stddev_prior > 0;
    }
    return false;
  };

  const isFormValid = () => {
    const basicValid = formData.name.trim() &&
                      formData.hypothesis.trim() &&
                      formData.priorType && // Prior type must be selected in design step
                      formData.outcomeType && // Outcome type must be selected in design step
                      formData.arms.length >= 2;

    const armsValid = formData.arms.every(arm =>
      arm.arm_name.trim() && isPriorParamValid(arm)
    );

    return basicValid && armsValid;
  };

  return (
    <Flex direction="column" gap="6">
      {/* Basic Information */}
      <SectionCard title="Basic Information">
        <Flex direction="column" gap="4">
          <Flex gap="4">
            <Box style={{ flex: 1 }}>
              <Text as="label" size="2" weight="bold" style={{ marginBottom: '6px', display: 'block' }}>
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
            <Text as="label" size="2" weight="bold" style={{ marginBottom: '6px', display: 'block' }}>
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
            <Box style={{ flex: 1 }}>
              <Text as="label" size="2" weight="bold" style={{ marginBottom: '6px', display: 'block' }}>
                Start Date
              </Text>
              <TextField.Root
                type="date"
                value={formData.startDate}
                onChange={(e) => updateBasicInfo('startDate', e.target.value)}
              />
            </Box>
            <Box style={{ flex: 1 }}>
              <Text as="label" size="2" weight="bold" style={{ marginBottom: '6px', display: 'block' }}>
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

      {/* Treatment Arms */}
      <SectionCard title="Treatment Arms">
        <Flex direction="column" gap="3" style={{ marginBottom: '20px' }}>
          <Text size="2" color="gray">
            Configure your experiment arms with prior beliefs.
          </Text>
          {formData.priorType && formData.outcomeType && (
            <Box style={{
              background: 'var(--accent-2)',
              border: '1px solid var(--accent-6)',
              borderRadius: '6px',
              padding: '12px'
            }}>
              <Text size="2" weight="medium" style={{ color: 'var(--accent-11)' }}>
                Selected Configuration: {formData.priorType === 'beta' ? 'Beta Distribution' : 'Normal Distribution'} × {formData.outcomeType === 'binary' ? 'Binary' : 'Real-valued'} Outcome
              </Text>
              <Text size="1" color="gray" style={{ marginTop: '4px', display: 'block' }}>
                {formData.priorType === 'beta'
                  ? 'Using Alpha (prior successes) and Beta (prior failures) parameters'
                  : 'Using Mean and Standard Deviation parameters'
                }
              </Text>
            </Box>
          )}
          {!formData.priorType || !formData.outcomeType && (
            <Box style={{
              background: 'var(--orange-2)',
              border: '1px solid var(--orange-6)',
              borderRadius: '6px',
              padding: '12px'
            }}>
              <Text size="2" weight="medium" style={{ color: 'var(--orange-11)' }}>
                ⚠️ Prior distribution and outcome type must be selected in the Design step first
              </Text>
            </Box>
          )}
        </Flex>

        <Flex direction="column" gap="4">
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

          <Flex justify="center" style={{ marginTop: '16px' }}>
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

      <NavigationButtons
        onBack={onBack}
        onNext={handleSaveExperiment}
        nextLabel="Continue to Summary"
        nextDisabled={!isFormValid()}
      />
    </Flex>
  );
}

interface ArmCardProps {
  arm: MABArm;
  armIndex: number;
  priorType: 'beta' | 'normal';
  canDelete: boolean;
  onUpdate: (updatedArm: Partial<MABArm>) => void;
  onDelete: () => void;
}

function ArmCard({ arm, armIndex, priorType, canDelete, onUpdate, onDelete }: ArmCardProps) {
  return (
    <Card style={{ padding: '0', border: '1px solid var(--gray-6)' }}>
      {/* Header */}
      <Flex
        align="center"
        justify="between"
        style={{
          padding: '16px 20px',
          backgroundColor: 'var(--gray-2)',
          borderBottom: '1px solid var(--gray-6)'
        }}
      >
        <Flex align="center" gap="2">
          <Box
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-9)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {armIndex + 1}
          </Box>
          <Text weight="bold">
            {armIndex === 0 ? 'Control Arm' : 'Treatment Arm'}
          </Text>
        </Flex>

        <IconButton
          onClick={onDelete}
          disabled={!canDelete}
          color="red"
          variant="soft"
          size="1"
        >
          <TrashIcon />
        </IconButton>
      </Flex>

      {/* Content */}
      <Box style={{ padding: '20px' }}>
        <Flex gap="6">
          <Flex direction="column" gap="4" style={{ flex: 1 }}>
            <Box>
              <Text as="label" size="2" weight="bold" style={{ marginBottom: '6px', display: 'block' }}>
                Arm Name
              </Text>
              <TextField.Root
                value={arm.arm_name}
                onChange={(e) => onUpdate({ arm_name: e.target.value })}
                placeholder="Enter arm name"
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="bold" style={{ marginBottom: '6px', display: 'block' }}>
                Description
              </Text>
              <TextArea
                value={arm.arm_description || ''}
                onChange={(e) => onUpdate({ arm_description: e.target.value })}
                placeholder="Describe this arm..."
                style={{ minHeight: '80px' }}
              />
            </Box>
          </Flex>

          <Flex direction="column" gap="4" style={{ flex: 1 }}>
            {!priorType && (
              <Box style={{
                background: 'var(--orange-2)',
                border: '1px solid var(--orange-6)',
                borderRadius: '6px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <Text size="2" style={{ color: 'var(--orange-11)' }}>
                  Select prior distribution in Design step first
                </Text>
              </Box>
            )}

            {priorType === 'beta' && (
              <Flex gap="3">
                <Box style={{ flex: 1 }}>
                  <Text as="label" size="2" weight="bold" style={{ marginBottom: '6px', display: 'block' }}>
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
                <Box style={{ flex: 1 }}>
                  <Text as="label" size="2" weight="bold" style={{ marginBottom: '6px', display: 'block' }}>
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
                <Box style={{ flex: 1 }}>
                  <Text as="label" size="2" weight="bold" style={{ marginBottom: '6px', display: 'block' }}>
                  Mean Prior
                  </Text>
                  <TextField.Root
                  type="number"
                  value={arm.mean_prior ?? ''}
                  onChange={(e) => onUpdate({ mean_prior: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Prior mean"
                  />
                </Box>
                <Box style={{ flex: 1 }}>
                  <Text as="label" size="2" weight="bold" style={{ marginBottom: '6px', display: 'block' }}>
                    Std Dev Prior
                  </Text>
                  <TextField.Root
                    type="number"
                    value={arm.stddev_prior?.toString() || '1'}
                    onChange={(e) => onUpdate({ stddev_prior: Number(e.target.value) })}
                    placeholder="Prior std dev"
                  />
                </Box>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Box>
    </Card>
  );
}
