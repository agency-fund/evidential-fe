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
import { useListDatasources, useListParticipantTypes } from '@/api/admin';
import { isHttpOk } from '@/services/typehelper';
import { useCurrentOrganization } from '@/app/providers/organization-provider';

interface InitialFormProps {
  formData: ExperimentFormData;
  onFormDataChange: (data: ExperimentFormData) => void;
  onNext: () => void;
}

export function InitialForm({ formData, onFormDataChange, onNext }: InitialFormProps) {
  const org = useCurrentOrganization();
  const { data: datasourcesData } = useListDatasources();
  const [selectedDatasource, setSelectedDatasource] = useState<string>('');
  const { data: participantTypesData, isLoading: loadingParticipantTypes } = useListParticipantTypes(
    selectedDatasource,
    {
      swr: {
        enabled: !!selectedDatasource,
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

  useEffect(() => {
    setShowArmsError(formData.arms.length < 2);
  }, [formData.arms]);

  // Set the first datasource as default when data loads
  useEffect(() => {
    if (datasourcesData && isHttpOk(datasourcesData) && datasourcesData.data.items.length > 0 && !selectedDatasource) {
      // Filter datasources to only those in the current organization
      const orgDatasources = datasourcesData.data.items.filter((ds) => org && ds.organization_id === org.current.id);
      if (orgDatasources.length > 0) {
        setSelectedDatasource(orgDatasources[0].id);
      }
    }
  }, [datasourcesData, selectedDatasource, org]);

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
      <Card>
        <Flex direction="column" gap="3">
          <Text as="label" size="2" weight="bold">
            Data Source & Participants Type
          </Text>

          {!datasourcesData || !isHttpOk(datasourcesData) ? (
            <Text color="gray">Loading datasources...</Text>
          ) : (
            <Flex direction="row" gap="2">
              <Select.Root value={selectedDatasource} onValueChange={setSelectedDatasource}>
                <Select.Trigger placeholder="Select a datasource" />
                <Select.Content>
                  {datasourcesData.data.items
                    .filter((ds) => org && ds.organization_id === org.current.id)
                    .map((datasource) => (
                      <Select.Item key={datasource.id} value={datasource.id}>
                        {datasource.name} ({datasource.driver === 'bigquery' ? 'Google BigQuery' : 'PostgreSQL'})
                      </Select.Item>
                    ))}
                </Select.Content>
              </Select.Root>

              {selectedDatasource &&
                (loadingParticipantTypes ? (
                  <Flex align="center" gap="2">
                    <Spinner size="1" />
                    <Text size="2">Loading participant types...</Text>
                  </Flex>
                ) : !participantTypesData || !isHttpOk(participantTypesData) ? (
                  <Text color="gray">No participant types available</Text>
                ) : (
                  <Select.Root
                    value={formData.participantType || ''}
                    onValueChange={(value) =>
                      onFormDataChange({
                        ...formData,
                        datasourceId: selectedDatasource,
                        participantType: value,
                      })
                    }
                  >
                    <Select.Trigger placeholder="Select a participant type" />
                    <Select.Content>
                      {participantTypesData.data.items.map((pt) => (
                        <Select.Item key={pt.participant_type} value={pt.participant_type}>
                          {pt.participant_type}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                ))}
            </Flex>
          )}
        </Flex>
      </Card>

      <Flex direction="column" gap="4">
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
