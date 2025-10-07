'use client';

import { Box, Button, Flex, IconButton, Text } from '@radix-ui/themes';
import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons';

export interface IncludeNullButtonProps {
  checked: boolean;
  singularValue?: boolean;
  onChange: (checked: boolean) => void;
  minWidth?: string;
}

export function IncludeNullButton({ checked, onChange, singularValue = false, minWidth }: IncludeNullButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onChange(true);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    onChange(false);
  };

  if (checked) {
    return (
      <Flex gap="1" align="center" justify="center" py="1">
        <Text size="2" weight="medium" style={{ textAlign: 'center', flex: 1 }}>
          {singularValue ? 'NULL' : 'OR NULL'}
        </Text>
        <IconButton variant="soft" size="1" onClick={handleRemove}>
          <Cross2Icon />
        </IconButton>
      </Flex>
    );
  }

  return (
    <Box py="1">
      <Button variant="soft" size="1" style={minWidth ? { minWidth } : undefined} onClick={handleClick}>
        <PlusIcon /> OR NULL
      </Button>
    </Box>
  );
}
