'use client';

import { Flex, Spinner, Text } from '@radix-ui/themes';
import { Responsive } from '@radix-ui/themes/props';

export function XSpinner({ message, size = '2' }: { message?: string; size?: Responsive<'2' | '1' | '3'> }) {
  return (
    <Flex gap="2" align="center">
      <Spinner size={size} />
      {message && <Text size={size}>{message}</Text>}
    </Flex>
  );
}
