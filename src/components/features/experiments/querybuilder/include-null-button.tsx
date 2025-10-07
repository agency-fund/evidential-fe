'use client';

import { Button, Flex, IconButton, Text } from '@radix-ui/themes';
import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons';

export interface IncludeNullButtonProps {
  checked: boolean;
  singularValue?: boolean;
  onChange: (checked: boolean) => void;
}

export function IncludeNullButton({ checked, onChange, singularValue = false }: IncludeNullButtonProps) {
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
    <Flex direction="column" py="1">
      <Button variant="soft" size="1" onClick={handleClick}>
        <PlusIcon /> OR NULL
      </Button>
    </Flex>
  );
}
