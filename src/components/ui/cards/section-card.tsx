import { Card, Flex, Heading, Separator } from '@radix-ui/themes';
import React from 'react';

export type SectionCardProps = {
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
};

export const SectionCard: React.FC<SectionCardProps> = ({ title, headerRight, children }) => {
  return (
    <Card>
      <Flex direction="row" gap="4" align="center" justify="between" py="2">
        <Heading size="3">{title}</Heading>
        {headerRight}
      </Flex>
      <Separator my="3" size="4" />

      {children}
    </Card>
  );
};
