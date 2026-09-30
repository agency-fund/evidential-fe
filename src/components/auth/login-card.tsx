import { Card, Flex } from '@radix-ui/themes';
import Image from 'next/image';
import { PropsWithChildren } from 'react';

export default function LoginCard({ children }: PropsWithChildren) {
  return (
    <Flex direction="column" justify="center" align="center" height="100vh">
      <Card size="3" style={{ boxShadow: 'var(--shadow-3)' }}>
        <Flex direction="column" gap="4" align="center" px="2" py="3">
          <Image src="/evidential-logo.svg" alt="Evidential Logo" width={200} height={35} loading="eager" />
          <Flex direction="column" gap="3">
            {children}
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
}
