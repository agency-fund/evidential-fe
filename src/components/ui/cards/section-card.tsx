'use client';
import { Card, Flex, Heading, Separator } from '@radix-ui/themes';
import React from 'react';

export type SectionCardProps = {
  /**
   * Title to display in the header. Optional.
   * Note: If `headerLeft` is supplied, this prop is ignored.
   */
  title?: string;
  /**
   * Custom component to display on the left side of the header.
   * If not provided, defaults to a Heading with the `title` prop.
   */
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
};

export const SectionCard: React.FC<SectionCardProps> = ({ title, headerLeft, headerRight, children }) => {
  return (
    <Card>
      <Flex direction="row" gap="4" align="center" justify="between" py="1" wrap="wrap">
        {headerLeft ?? (
          <Heading size="3" wrap="nowrap">
            {title}
          </Heading>
        )}
        {headerRight}
      </Flex>
      <Separator my="2" size="4" />
      {children}
    </Card>
  );
};
