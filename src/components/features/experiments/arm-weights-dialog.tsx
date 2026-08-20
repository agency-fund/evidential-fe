'use client';
import { Button, Dialog, Flex, Grid, Text, TextField } from '@radix-ui/themes';
import { Fragment, useState } from 'react';
import { Arm } from '@/api/methods.schemas';
import { Pencil1Icon } from '@radix-ui/react-icons';

interface ArmWeightsDialogProps {
  arms: Omit<Arm, 'arm_id'>[];
  onWeightsChange: (weights: number[]) => void;
  disabled?: boolean;
  button_text?: string;
}

const defaultWeights = (arms: ArmWeightsDialogProps['arms']): string[] => {
  const hasWeights = arms.some((arm) => arm.arm_weight != null);
  if (hasWeights) {
    return arms.map((arm) => (arm.arm_weight ?? 0).toFixed(1));
  }
  const balancedWeight = (100 / arms.length).toFixed(1);
  return arms.map(() => balancedWeight);
};

export function ArmWeightsDialog({
  arms,
  onWeightsChange,
  disabled,
  button_text = 'Edit Weights',
}: ArmWeightsDialogProps) {
  const [open, setOpen] = useState(false);
  const [localWeights, setLocalWeights] = useState<string[]>([]);
  const [weightsError, setWeightsError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setLocalWeights(defaultWeights(arms));
      setWeightsError(null);
    }
    setOpen(nextOpen);
  };

  const validateWeights = (weights: string[]): boolean => {
    const numWeights = weights.map((w) => parseFloat(w) || 0);

    if (numWeights.some((w) => w <= 0 || w >= 100)) {
      setWeightsError('Weights must be greater than 0 and less than 100.');
      return false;
    }

    const sum = numWeights.reduce((acc, w) => acc + w, 0);
    if (Math.abs(sum - 100) >= 0.01) {
      // Allow small floating point errors
      setWeightsError(`Weights must sum to 100% (currently ${sum.toFixed(1)}%)`);
      return false;
    }

    setWeightsError(null);
    return true;
  };

  const handleWeightChange = (index: number, value: string) => {
    // Allow empty string, numbers, and one decimal point
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      const newWeights = [...localWeights];
      newWeights[index] = value;
      setLocalWeights(newWeights);
      validateWeights(newWeights);
    }
  };

  const handleSubmit = () => {
    if (validateWeights(localWeights)) {
      const numWeights = localWeights.map((w) => parseFloat(w) || 0);
      onWeightsChange(numWeights);
      setOpen(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger>
        <Button size="1" variant="soft" disabled={disabled}>
          <Pencil1Icon />
          {button_text}
        </Button>
      </Dialog.Trigger>
      <Dialog.Content
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
      >
        <Dialog.Title>Edit Arm Weights</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Adjust the allocation per arm. Values must sum to 100%.
        </Dialog.Description>
        <Flex direction="column" gap="3">
          <Grid columns="2" gap="2" align="center">
            {arms.map((arm, armIndex) => (
              <Fragment key={`arm-${armIndex}`}>
                <Text size="2" weight="bold">
                  Arm {armIndex + 1}: {arm.arm_name || <em>none</em>}
                </Text>
                <Flex align="center" gap="2">
                  <TextField.Root
                    value={localWeights[armIndex] || ''}
                    onChange={(e) => handleWeightChange(armIndex, e.target.value)}
                    placeholder="0.0"
                    style={{ width: '6ch' }}
                  />
                  <Text size="2" color="gray">
                    %
                  </Text>
                </Flex>
              </Fragment>
            ))}
          </Grid>
          <Text size="2" color="red" style={{ minHeight: '1.5em' }}>
            {weightsError}
          </Text>
          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="button" onClick={handleSubmit} disabled={weightsError !== null}>
              Apply Weights
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
