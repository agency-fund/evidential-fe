'use client';
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  IconButton,
  Select,
  Spinner,
  Text,
  TextArea,
  TextField,
} from '@radix-ui/themes';
import { ExperimentFormData } from './page';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import { useListParticipantTypes } from '@/api/admin';

interface InitialFormProps {
  formData: ExperimentFormData;
  onFormDataChange: (data: ExperimentFormData) => void;
  onNext: () => void;
}

export function InitialForm({ formData, onFormDataChange, onNext }: InitialFormProps) {
  const { data: participantTypesData, isLoading: loadingParticipantTypes } = useListParticipantTypes(
    formData.datasourceId || '',
    {
      swr: {
        enabled: !!formData.datasourceId,
      },
    },
  );
  const addArm = () => {
    onFormDataChange({
      ...formData,
      arms: [...formData.arms, { arm_name: '', arm_description: '' }],
    });
  };

  const removeArm = (index: number) => {
    onFormDataChange({
      ...formData,
      arms: formData.arms.filter((_, i) => i !== index),
    });
  };

  const updateArm = (index: number, field: 'arm_name' | 'arm_description', value: string) => {
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
                ) : !participantTypesData ? (
                  <Text color="gray">No participant types available</Text>
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
            <Flex direction="column" gap="1">
              <Heading size="4">Arms</Heading>
              {showArmsError && (
                <Text size="1" color="red" mb="2">
                  At least two arms are required
                </Text>
              )}
            </Flex>

            <Flex direction="column" gap="3">
              {formData.arms.map((arm, index) => (
                <Card key={index}>
                  <Flex direction="column" gap="2">
                    <Flex justify="between" align="center">
                      <Text size="2" weight="bold">
                        Arm {index + 1}
                      </Text>
                      <IconButton size="1" color="red" variant="soft" onClick={() => removeArm(index)}>
                        <TrashIcon />
                      </IconButton>
                    </Flex>

                    <Flex direction="column" gap="2">
                      <Box style={{ maxWidth: '50%' }}>
                        <TextField.Root
                          value={arm.arm_name}
                          placeholder={'Arm Name'}
                          onChange={(e) => updateArm(index, 'arm_name', e.target.value)}
                          required
                        />
                      </Box>
                    </Flex>

                    <Flex direction="column" gap="2">
                      <TextArea
                        placeholder="Description"
                        value={arm.arm_description || ''}
                        onChange={(e) => updateArm(index, 'arm_description', e.target.value)}
                      />
                    </Flex>
                  </Flex>
                </Card>
              ))}
              <Flex justify="end" mt="4">
                <Button type="button" onClick={addArm}>
                  <PlusIcon /> Add Arm
                </Button>
              </Flex>
            </Flex>
          </Flex>
        </Card>

        <Flex justify="end" mt="4">
          <Button type="submit">Next</Button>
        </Flex>
      </Flex>
    </form>
  );
}
