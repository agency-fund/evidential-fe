'use client';

import { Box, Button, Flex, IconButton, Text } from '@radix-ui/themes';
import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons';

export interface IncludeNullButtonProps {
  checked: boolean;
  singularValue?: boolean;
  // True under "is not" operators, where NULL is one more value being excluded.
  negated?: boolean;
  onChange: (checked: boolean) => void;
  minWidth?: string;
}

export function IncludeNullButton({
  checked,
  onChange,
  singularValue = false,
  negated = false,
  minWidth,
}: IncludeNullButtonProps) {
  const label = negated ? 'AND NOT NULL' : 'OR NULL';

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
        <Flex flexGrow="1" justify="center">
          <Text size="2" weight="medium" style={{ textAlign: 'center' }}>
            {singularValue ? 'NULL' : label}
          </Text>
        </Flex>
        <IconButton variant="soft" size="1" onClick={handleRemove}>
          <Cross2Icon />
        </IconButton>
      </Flex>
    );
  }

  return (
    <Box py="1">
      <Button variant="soft" size="1" style={minWidth ? { minWidth } : undefined} onClick={handleClick}>
        <PlusIcon /> {label}
      </Button>
    </Box>
  );
}
