'use client';
import React from 'react';
import { Box, Card, Flex, Text, TextField, TextArea, Button, IconButton } from '@radix-ui/themes';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { CMABFormData, ContextVariable, ContextVariableType } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { SectionCard } from '@/components/ui/cards/section-card';

interface CMABContextFormProps {
  formData: CMABFormData;
  onFormDataChange: (data: CMABFormData) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CMABContextForm({ 
  formData, 
  onFormDataChange, 
  onNext, 
  onBack 
}: CMABContextFormProps) {

  const updateContextVariable = (index: number, updatedVariable: Partial<ContextVariable>) => {
    const updatedVariables = formData.contextVariables.map((variable, i) => 
      i === index ? { ...variable, ...updatedVariable } : variable
    );
    onFormDataChange({
      ...formData,
      contextVariables: updatedVariables,
    });
  };

  const addContextVariable = () => {
    const newVariable: ContextVariable = {
      name: '',
      description: '',
      type: 'binary',
    };
    
    onFormDataChange({
      ...formData,
      contextVariables: [...formData.contextVariables, newVariable],
    });
  };

  const deleteContextVariable = (index: number) => {
    if (formData.contextVariables.length <= 1) return; // Minimum 1 context variable required
    
    onFormDataChange({
      ...formData,
      contextVariables: formData.contextVariables.filter((_, i) => i !== index),
    });
  };

  const isVariableValid = (variable: ContextVariable) => {
    return variable.name.trim() && variable.description.trim() && variable.type;
  };

  const isFormValid = () => {
    const hasVariables = formData.contextVariables.length >= 1;
    const allVariablesValid = formData.contextVariables.every(variable => isVariableValid(variable));
    
    // Check for unique names
    const names = formData.contextVariables.map(v => v.name.trim().toLowerCase());
    const uniqueNames = new Set(names);
    const hasUniqueNames = names.length === uniqueNames.size;
    
    console.log('🔍 Context form validation:', {
      hasVariables,
      allVariablesValid,
      hasUniqueNames,
      variables: formData.contextVariables.map(v => ({
        name: v.name,
        description: v.description,
        type: v.type,
        valid: isVariableValid(v)
      }))
    });
    
    return hasVariables && allVariablesValid && hasUniqueNames;
  };

  return (
    <Flex direction="column" gap="6">
      <SectionCard title="Context Variables">
        <Flex direction="column" gap="3" style={{ marginBottom: '20px' }}>
          <Text size="2" color="gray">
            Define the context variables that the algorithm will use to make personalized decisions. 
            Each variable helps the system understand when different arms might perform better.
          </Text>
        </Flex>

        <Flex direction="column" gap="4">
          {formData.contextVariables.map((variable, index) => (
            <ContextVariableCard
              key={index}
              variable={variable}
              variableIndex={index}
              canDelete={formData.contextVariables.length > 1}
              onUpdate={(updatedVariable) => updateContextVariable(index, updatedVariable)}
              onDelete={() => deleteContextVariable(index)}
            />
          ))}
          
          <Flex justify="center" style={{ marginTop: '16px' }}>
            <Button onClick={addContextVariable} variant="outline">
              <PlusIcon />
              Add Context Variable
            </Button>
          </Flex>
        </Flex>
      </SectionCard>

      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        nextLabel="Continue to Design"
        nextDisabled={!isFormValid()}
      />
    </Flex>
  );
}

interface ContextVariableCardProps {
  variable: ContextVariable;
  variableIndex: number;
  canDelete: boolean;
  onUpdate: (updatedVariable: Partial<ContextVariable>) => void;
  onDelete: () => void;
}

function ContextVariableCard({ variable, variableIndex, canDelete, onUpdate, onDelete }: ContextVariableCardProps) {
  return (
    <Card style={{ padding: '0', border: '1px solid var(--gray-6)' }}>
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
            {variableIndex + 1}
          </Box>
          <Text weight="bold">Context Variable {variableIndex + 1}</Text>
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

      <Box style={{ padding: '20px' }}>
        <Flex gap="6">
          <Flex direction="column" gap="4" style={{ flex: 2 }}>
            <Box>
              <Text as="label" size="2" weight="bold" style={{ marginBottom: '6px', display: 'block' }}>
                Context Name
              </Text>
              <TextField.Root
                value={variable.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="e.g., device_type, user_age_group"
              />
              <Text size="1" color="gray" style={{ marginTop: '4px', display: 'block' }}>
                Use snake_case naming (e.g., device_type, user_age_group)
              </Text>
            </Box>
            
            <Box>
              <Text as="label" size="2" weight="bold" style={{ marginBottom: '6px', display: 'block' }}>
                Description
              </Text>
              <TextArea
                value={variable.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Describe this context variable..."
                style={{ minHeight: '80px' }}
              />
            </Box>
          </Flex>

          <Flex direction="column" gap="4" style={{ flex: 1 }}>
            <Box>
              <Text as="label" size="2" weight="bold" style={{ marginBottom: '12px', display: 'block' }}>
                Context Type
              </Text>
              <Flex direction="column" gap="2">
                <ContextTypeOption
                  type="binary"
                  title="Binary"
                  description="Two categories (0/1, true/false)"
                  isSelected={variable.type === 'binary'}
                  onSelect={() => onUpdate({ type: 'binary' })}
                />
                <ContextTypeOption
                  type="real_valued"
                  title="Real-valued"
                  description="Continuous numbers"
                  isSelected={variable.type === 'real_valued'}
                  onSelect={() => onUpdate({ type: 'real_valued' })}
                />
              </Flex>
              <Text size="1" color="gray" style={{ marginTop: '8px', display: 'block' }}>
                {variable.type === 'binary' 
                  ? 'Binary: 0 = Category A, 1 = Category B'
                  : 'Real-valued: Continuous numeric values'
                }
              </Text>
            </Box>
          </Flex>
        </Flex>
      </Box>
    </Card>
  );
}

interface ContextTypeOptionProps {
  type: ContextVariableType;
  title: string;
  description: string;
  isSelected: boolean;
  onSelect: () => void;
}

function ContextTypeOption({ type, title, description, isSelected, onSelect }: ContextTypeOptionProps) {
  return (
    <Box
      style={{
        border: isSelected ? '2px solid var(--accent-9)' : '1px solid var(--gray-6)',
        backgroundColor: isSelected ? 'var(--accent-2)' : 'white',
        borderRadius: '6px',
        padding: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onClick={onSelect}
    >
      <Flex align="start" gap="2">
        <Box
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: `2px solid ${isSelected ? 'var(--accent-9)' : 'var(--gray-6)'}`,
            backgroundColor: isSelected ? 'var(--accent-9)' : 'white',
            marginTop: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isSelected && (
            <Box
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'white',
              }}
            />
          )}
        </Box>
        <Flex direction="column" gap="1">
          <Text size="2" weight="bold">{title}</Text>
          <Text size="1" color="gray">{description}</Text>
        </Flex>
      </Flex>
    </Box>
  );
}
