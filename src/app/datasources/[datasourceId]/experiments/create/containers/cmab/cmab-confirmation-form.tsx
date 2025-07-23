'use client';
import React from 'react';
import { Flex, Table, Text, Callout } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { CMABFormData } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { SectionCard } from '@/components/ui/cards/section-card';
import { ReadMoreText } from '@/components/ui/read-more-text';

interface CMABConfirmationFormProps {
  formData: CMABFormData;
  onBack: () => void;
  onFormDataChange: (data: CMABFormData) => void;
}

export function CMABConfirmationForm({ 
  formData, 
  onBack, 
  onFormDataChange 
}: CMABConfirmationFormProps) {
  
  const handleSaveExperiment = () => {
    alert('Contextual Multi-Armed Bandit experiment creation not yet implemented');
  };

  return (
    <Flex direction="column" gap="6">
      <SectionCard title="Basic Information">
        <Table.Root>
          <Table.Body>
            <Table.Row>
              <Table.RowHeaderCell>Experiment Type</Table.RowHeaderCell>
              <Table.Cell>Contextual Multi-Armed Bandit</Table.Cell>
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

      <SectionCard title="Context Variables">
        <Text size="2" color="gray" style={{ marginBottom: '16px' }}>
          {formData.contextVariables.length} context variable{formData.contextVariables.length !== 1 ? 's' : ''} configured for personalization
        </Text>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {formData.contextVariables.map((variable, index) => (
              <Table.Row key={index}>
                <Table.Cell>
                  <Text weight="bold">{variable.name}</Text>
                </Table.Cell>
                <Table.Cell>
                  <ReadMoreText text={variable.description} />
                </Table.Cell>
                <Table.Cell>
                  <span style={{
                    background: variable.type === 'binary' ? 'var(--blue-3)' : 'var(--green-3)',
                    color: variable.type === 'binary' ? 'var(--blue-11)' : 'var(--green-11)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    {variable.type === 'binary' ? 'Binary' : 'Real-valued'}
                  </span>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </SectionCard>

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
                  Mean/Standard Deviation parameters with context-aware personalization
                </Text>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>Context Variables</Table.RowHeaderCell>
              <Table.Cell>
                {formData.contextVariables.length} configured
                <Text size="1" color="gray" style={{ display: 'block', marginTop: '4px' }}>
                  {formData.contextVariables.map(v => v.name).join(', ')}
                </Text>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </SectionCard>

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

      {/* Info about CMAB */}
      <Callout.Root>
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>
          Contextual Multi-Armed Bandit experiments provide personalized recommendations by learning 
          which arms work best for different context situations. No power analysis or sample size planning is required.
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