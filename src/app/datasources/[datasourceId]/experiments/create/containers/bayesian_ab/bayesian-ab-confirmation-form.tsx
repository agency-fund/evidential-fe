'use client';
import React from 'react';
import { Flex, Table, Text, Callout } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { BayesianABFormData } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { SectionCard } from '@/components/ui/cards/section-card';
import { ReadMoreText } from '@/components/ui/read-more-text';

interface BayesianABConfirmationFormProps {
  formData: BayesianABFormData;
  onBack: () => void;
  onFormDataChange: (data: BayesianABFormData) => void;
}

export function BayesianABConfirmationForm({ 
  formData, 
  onBack, 
  onFormDataChange 
}: BayesianABConfirmationFormProps) {
  
  const handleSaveExperiment = () => {
    alert('Bayesian A/B experiment creation not yet implemented');
  };

  return (
    <Flex direction="column" gap="6">
      {/* Basic Information */}
      <SectionCard title="Basic Information">
        <Table.Root>
          <Table.Body>
            <Table.Row>
              <Table.RowHeaderCell>Experiment Type</Table.RowHeaderCell>
              <Table.Cell>Bayesian A/B Testing</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>Name</Table.RowHeaderCell>
              <Table.Cell>{formData.name}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>Hypothesis</Table.RowHeaderCell>
              <Table.Cell>
                <ReadMoreText text={formData.hypothesis} />
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>Participant Type</Table.RowHeaderCell>
              <Table.Cell>{formData.participantType || '-'}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>Start Date</Table.RowHeaderCell>
              <Table.Cell>{new Date(formData.startDate).toLocaleDateString()}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>End Date</Table.RowHeaderCell>
              <Table.Cell>{new Date(formData.endDate).toLocaleDateString()}</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </SectionCard>

      {/* Configuration */}
      <SectionCard title="Configuration">
        <Table.Root>
          <Table.Body>
            <Table.Row>
              <Table.RowHeaderCell>Outcome Type</Table.RowHeaderCell>
              <Table.Cell>
                {formData.outcomeType === 'binary' ? 'Binary' : 'Real-valued'}
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>Prior Distribution</Table.RowHeaderCell>
              <Table.Cell>
                Normal Distribution
                <Text size="1" color="gray" style={{ display: 'block', marginTop: '4px' }}>
                  Mean/Standard Deviation parameters for Bayesian inference
                </Text>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </SectionCard>

      {/* Treatment Arms */}
      <SectionCard title="Treatment Arms">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Mean Prior</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Std Dev Prior</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {formData.arms.map((arm, index) => (
              <Table.Row key={index}>
                <Table.Cell>
                  <Text weight="bold">{arm.arm_name}</Text>
                  {index === 0 && (
                    <Text size="1" color="gray" style={{ display: 'block' }}>
                      Control
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <ReadMoreText text={arm.arm_description || '-'} />
                </Table.Cell>
                <Table.Cell>{arm.mean_prior ?? 0}</Table.Cell>
                <Table.Cell>{arm.stddev_prior || 1}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </SectionCard>

      {/* Info about Bayesian A/B */}
      <Callout.Root>
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>
          Bayesian A/B experiments provide credible intervals and probability statements. 
          No power analysis or sample size planning is required - results update continuously.
        </Callout.Text>
      </Callout.Root>

      <NavigationButtons
        onBack={onBack}
        onNext={handleSaveExperiment}
        nextLabel="Save Experiment"
        showBack={true}
      />
    </Flex>
  );
}