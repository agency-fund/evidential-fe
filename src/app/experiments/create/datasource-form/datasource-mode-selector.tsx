'use client';
import { Flex, RadioGroup, Text } from '@radix-ui/themes';
import { ReactNode } from 'react';

export type DatasourceMode = 'existing' | 'create' | 'none';

interface DatasourceModeSelectorProps {
  mode: DatasourceMode;
  onModeChange: (mode: DatasourceMode) => void;
  hasDatasources: boolean;
  showNoDwhOption?: boolean;
  existingContent?: ReactNode;
  createContent?: ReactNode;
}

export const DatasourceModeSelector = ({
  mode,
  onModeChange,
  hasDatasources,
  showNoDwhOption = false,
  existingContent,
  createContent,
}: DatasourceModeSelectorProps) => (
  <Flex direction="column" gap="3">
    <RadioGroup.Root value={mode} onValueChange={(value) => onModeChange(value as DatasourceMode)}>
      <Flex direction="column" gap="2">
        {hasDatasources && (
          <RadioGroup.Item value="existing">
            <Text weight="bold">Use an existing datasource</Text>
          </RadioGroup.Item>
        )}
        <RadioGroup.Item value="create">
          <Text weight="bold">Create a new datasource</Text>
        </RadioGroup.Item>
        {showNoDwhOption && (
          <RadioGroup.Item value="none">
            <Text weight="bold">No data warehouse</Text>
          </RadioGroup.Item>
        )}
      </Flex>
    </RadioGroup.Root>
    {mode === 'existing' && existingContent}
    {mode === 'create' && createContent}
  </Flex>
);
