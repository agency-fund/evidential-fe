'use client';
import {
  Badge,
  Box,
  Button,
  Card,
  CheckboxCards,
  Flex,
  Grid,
  Heading,
  IconButton,
  Select,
  Spinner,
  Text,
  TextArea,
  TextField,
} from '@radix-ui/themes';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { ArmWeightsDialog } from '@/components/features/experiments/arm-weights-dialog';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import { useListParticipantTypes } from '@/api/admin';
import Link from 'next/link';
import { WebhookSummary } from '@/api/methods.schemas';
import { ExperimentFormData, isFreqABFormData } from '@/app/datasources/[datasourceId]/experiments/create/types';

interface InitialFormProps {
  formData: ExperimentFormData;
  onFormDataChange: (data: ExperimentFormData) => void;
  onNext: () => void;
  onBack: () => void;
  webhooks: WebhookSummary[];
}

export function InitialForm({ formData, onFormDataChange, onNext, onBack, webhooks }: InitialFormProps) {
  const { data: participantTypesData, isLoading: loadingParticipantTypes } = useListParticipantTypes(
    formData.datasourceId || '',
    {
      swr: {
        enabled: !!formData.datasourceId,
      },
    },
  );

  const handleWeightsChange = (weights: number[]) => {
    if (isFreqABFormData(formData)) {
      const newArms = formData.arms.map((arm, i) => ({
        ...arm,
        arm_weight: weights[i],
      }));
      onFormDataChange({ ...formData, arms: newArms });
    }
  };

  const handleAddArm = () => {
    const new_arm =
      formData.arms.length == 0
        ? {
            arm_name: 'Control',
            arm_description: 'Arm 1 will be used as baseline for comparison in analysis.',
          }
        : { arm_name: '', arm_description: '' };
    const updatedData = {
      ...formData,
      arms: [...formData.arms, new_arm],
    };
    // Reset arm weights when adding an arm. User will have to update new weights.
    if (isFreqABFormData(updatedData)) {
      updatedData.arms = updatedData.arms.map((a) => ({ ...a, arm_weight: undefined }));
    }
    onFormDataChange(updatedData);
  };

  const handleRemoveArm = (index: number) => {
    const updatedData = {
      ...formData,
      arms: formData.arms.filter((_, i) => i !== index),
    };
    // Reset arm weights when removing an arm. User will have to update new weights.
    if (isFreqABFormData(updatedData)) {
      updatedData.arms = updatedData.arms.map((a) => ({ ...a, arm_weight: undefined }));
    }
    onFormDataChange(updatedData);
  };

  const handleUpdateArm = (index: number, field: 'arm_name' | 'arm_description', value: string) => {
    const newArms = [...formData.arms];
    newArms[index] = { ...newArms[index], [field]: value };
    onFormDataChange({ ...formData, arms: newArms });
  };

  const [showArmsError, setShowArmsError] = useState(false);

  // Set dropdown initial value
  useEffect(() => {
    if (participantTypesData !== undefined && participantTypesData.items.length > 0 && !formData.participantType) {
      onFormDataChange({ ...formData, participantType: participantTypesData.items[0].participant_type });
    }
  }, [formData, participantTypesData, onFormDataChange]);

  useEffect(() => {
    setShowArmsError(formData.arms.length < 2);
  }, [formData.arms]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.arms.length < 2) {
      setShowArmsError(true);
      return;
    }
    onNext();
  };

  const getValidationMessage = () => {
    if (!formData.name.trim()) {
      return 'Experiment name is required.';
    }
    if (!formData.hypothesis.trim()) {
      return 'Hypothesis is required.';
    }
    if (!formData.startDate) {
      return 'Start date is missing or invalid.';
    }
    if (!formData.endDate) {
      return 'End date is required.';
    }
    if (formData.arms.length < 2) {
      return 'At least two arms are required.';
    }
    for (let i = 0; i < formData.arms.length; i++) {
      if (!formData.arms[i].arm_name.trim()) {
        return `Arm ${i + 1} name is required.`;
      }
    }
    return '';
  };

  const isFormValid = getValidationMessage() === '';

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="4">
        <Card>
          <Flex direction="column" gap="3">
            <Text as="label" size="2" weight="bold">
              Choose Participants
            </Text>

            <Flex direction="row" gap="2">
              {formData.datasourceId &&
                (loadingParticipantTypes ? (
                  <Flex align="center" gap="2">
                    <Spinner size="1" />
                    <Text size="2">Loading participant types...</Text>
                  </Flex>
                ) : !participantTypesData || participantTypesData.items.length === 0 ? (
                  <Flex direction="column" gap="2">
                    <Text color="gray">No participant types available</Text>
                    <Link href={`/datasources/${formData.datasourceId}`} passHref>
                      <Button size="2" variant="soft">
                        Add a Participant Type
                      </Button>
                    </Link>
                  </Flex>
                ) : (
                  <Select.Root
                    value={formData.participantType || ''}
                    onValueChange={(value) =>
                      onFormDataChange({
                        ...formData,
                        participantType: value,
                      })
                    }
                  >
                    <Select.Trigger placeholder="Select a participant type" />
                    <Select.Content>
                      {participantTypesData.items.map((pt) => (
                        <Select.Item key={pt.participant_type} value={pt.participant_type}>
                          {pt.participant_type}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                ))}
            </Flex>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="3">
            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="bold">
                Experiment Name
              </Text>
              <TextField.Root
                value={formData.name}
                onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                required
              />
            </Flex>

            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="bold">
                Hypothesis
              </Text>
              <TextArea
                value={formData.hypothesis}
                onChange={(e) => onFormDataChange({ ...formData, hypothesis: e.target.value })}
                required
              />
            </Flex>
            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="bold">
                Design Document URL (optional)
              </Text>
              <TextField.Root
                value={formData.designUrl || ''}
                onChange={(e) => onFormDataChange({ ...formData, designUrl: e.target.value.trim() || undefined })}
                placeholder="https://docs.google.com/document/..."
              />
            </Flex>
          </Flex>
        </Card>

        <Card>
          <Flex gap="4">
            <Flex direction="column" gap="2" flexGrow="1">
              <Text as="label" size="2" weight="bold">
                Start Date
              </Text>
              <TextField.Root
                type="date"
                value={formData.startDate}
                onChange={(e) => onFormDataChange({ ...formData, startDate: e.target.value })}
                required
              />
            </Flex>

            <Flex direction="column" gap="2" flexGrow="1">
              <Text as="label" size="2" weight="bold">
                End Date
              </Text>
              <TextField.Root
                type="date"
                value={formData.endDate}
                onChange={(e) => onFormDataChange({ ...formData, endDate: e.target.value })}
                required
              />
            </Flex>
          </Flex>
        </Card>
        <Card>
          <Flex direction="column" gap="2">
            <Flex justify="between" align="start">
              <Flex direction="column" gap="1">
                <Heading size="4">Arms</Heading>
                {showArmsError && (
                  <Text size="1" color="red" mb="2">
                    At least two arms are required
                  </Text>
                )}
              </Flex>
              {isFreqABFormData(formData) && (
                <ArmWeightsDialog arms={formData.arms} onWeightsChange={handleWeightsChange} />
              )}
            </Flex>

            <Flex direction="column" gap="3">
              {formData.arms.map((arm, index) => (
                <Card key={index}>
                  <Flex direction="column" gap="2">
                    <Flex justify="between" align="center">
                      <Flex direction="row" gap="2" align="baseline">
                        <Text size="3" weight="bold">
                          Arm {index + 1} {0 == index && '(control)'}
                        </Text>
                        {isFreqABFormData(formData) && arm.arm_weight != null && (
                          <Badge>{`${arm.arm_weight.toFixed(1)}%`}</Badge>
                        )}
                      </Flex>
                      <IconButton size="1" color="red" variant="soft" onClick={() => handleRemoveArm(index)}>
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
                          placeholder={'Arm Name'}
                          onChange={(e) => handleUpdateArm(index, 'arm_name', e.target.value)}
                          required
                        />
                      </Box>
                    </Flex>

                    <Flex direction="column" gap="2">
                      <Text as="label" size="2" weight="bold">
                        Arm Description
                      </Text>
                      <TextArea
                        placeholder="Description"
                        value={arm.arm_description || ''}
                        onChange={(e) => handleUpdateArm(index, 'arm_description', e.target.value)}
                      />
                    </Flex>
                  </Flex>
                </Card>
              ))}
              <Flex justify="end" mt="4">
                <Button type="button" onClick={handleAddArm}>
                  <PlusIcon /> Add Arm
                </Button>
              </Flex>
            </Flex>
          </Flex>
        </Card>

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

        <NavigationButtons
          onBack={onBack}
          onNext={onNext}
          nextLabel="Next"
          nextDisabled={!isFormValid}
          tooltipMessage={getValidationMessage()}
        />
      </Flex>
    </form>
  );
}
