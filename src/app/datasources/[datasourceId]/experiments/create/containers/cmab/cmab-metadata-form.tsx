'use client';
import React from 'react';
import { Box, Card, Flex, Text, TextField, TextArea, Button, IconButton } from '@radix-ui/themes';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { CMABFormData, BayesianABArm } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { SectionCard } from '@/components/ui/cards/section-card';

interface CMABMetadataFormProps {
  formData: CMABFormData;
  onFormDataChange: (data: CMABFormData) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CMABMetadataForm({ 
  formData, 
  onFormDataChange, 
  onNext, 
  onBack 
}: CMABMetadataFormProps) {
  
  const updateBasicInfo = (field: keyof CMABFormData, value: any) => {
    onFormDataChange({
      ...formData,
      [field]: value,
    });
  };

  const updateArm = (index: number, updatedArm: Partial<BayesianABArm>) => {
    const updatedArms = formData.arms.map((arm, i) => 
      i === index ? { ...arm, ...updatedArm } : arm
    );
    onFormDataChange({
      ...formData,
      arms: updatedArms,
    });
  };

  const addArm = () => {
    const newArm: BayesianABArm = {
      arm_name: '',
      arm_description: '',
      mean_prior: 0,
      stddev_prior: 1,
    };
    
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

  const isPriorParamValid = (arm: BayesianABArm) => {
    return arm.mean_prior !== undefined && 
           arm.stddev_prior !== undefined && arm.stddev_prior > 0;
  };

  const isFormValid = () => {
    const basicValid = formData.name.trim() && 
                      formData.hypothesis.trim() && 
                      formData.participantType &&
                      formData.priorType && // Prior type must be selected in design step
                      formData.outcomeType && // Outcome type must be selected in design step
                      formData.arms.length >= 2;
    
    const armsValid = formData.arms.every(arm => 
      arm.arm_name.trim() && isPriorParamValid(arm)
    );
    
    console.log('🔍 Form validation:', {
      basicValid,
      armsValid,
      priorType: formData.priorType,
      outcomeType: formData.outcomeType,
      contextVariables: formData.contextVariables.length,
      arms: formData.arms.map(arm => ({
        name: arm.arm_name,
        mean_prior: arm.mean_prior,
        stddev_prior: arm.stddev_prior,
        valid: arm.arm_name.trim() && isPriorParamValid(arm)
      }))
    });
    
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
            <Box style={{ flex: 1 }}>
              <Text as="label" size="2" weight="bold" style={{ marginBottom: '6px', display: 'block' }}>
                Participant Type
              </Text>
              <TextField.Root
                value={formData.participantType || ''}
                onChange={(e) => updateBasicInfo('participantType', e.target.value)}
                placeholder="users"
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
            Configure your experiment arms with Bayesian priors using Normal distribution. 
            The algorithm will use context variables to personalize arm selection.
          </Text>
          {formData.priorType && formData.outcomeType && (
            <Box style={{ 
              background: 'var(--accent-2)', 
              border: '1px solid var(--accent-6)', 
              borderRadius: '6px', 
              padding: '12px' 
            }}>
              <Text size="2" weight="medium" style={{ color: 'var(--accent-11)' }}>
                Selected Configuration: Normal Distribution × {formData.outcomeType === 'binary' ? 'Binary' : 'Real-valued'} Outcome
              </Text>
              <Text size="1" color="gray" style={{ marginTop: '4px', display: 'block' }}>
                Using Mean and Standard Deviation parameters with {formData.contextVariables.length} context variable{formData.contextVariables.length !== 1 ? 's' : ''}
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
                ⚠️ Outcome type must be selected in the Design step first
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

      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        nextLabel="Continue to Summary"
        nextDisabled={!isFormValid()}
      />
    </Flex>
  );
}

interface ArmCardProps {
  arm: BayesianABArm;
  armIndex: number;
  canDelete: boolean;
  onUpdate: (updatedArm: Partial<BayesianABArm>) => void;
  onDelete: () => void;
}

function ArmCard({ arm, armIndex, canDelete, onUpdate, onDelete }: ArmCardProps) {
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
              backgroundColor: 'var(--amber-9)',
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
            <Flex gap="3">
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2" weight="bold" style={{ marginBottom: '6px', display: 'block' }}>
                  Mean Prior
                </Text>
                <TextField.Root
                  type="number"
                  value={arm.mean_prior?.toString() || '0'}
                  onChange={(e) => onUpdate({ mean_prior: Number(e.target.value) })}
                  placeholder="Prior mean"
                />
              </Box>
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2" weight="bold" style={{ marginBottom: '6px', display: 'block' }}>
                  Std Dev Prior
                </Text>
                <TextField.Root
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={arm.stddev_prior?.toString() || '1'}
                  onChange={(e) => onUpdate({ stddev_prior: Number(e.target.value) })}
                  placeholder="Prior std dev"
                />
              </Box>
            </Flex>
          </Flex>
        </Flex>
      </Box>
    </Card>
  );
}