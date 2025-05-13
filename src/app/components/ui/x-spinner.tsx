'use client';

import { Flex, Spinner, Text } from '@radix-ui/themes';

export function XSpinner({ message }: { message?: string }) {
  return (
    <Flex gap="2" align="center">
      <Spinner />
      {message && <Text>{message}</Text>}
    </Flex>
  );
}
