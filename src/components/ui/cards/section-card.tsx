import { Card, Flex, Heading, Separator } from '@radix-ui/themes';
import React from 'react';
import { XSpinner } from '../x-spinner';
import { GenericErrorCallout } from '../generic-error';

export type SectionCardProps = {
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: any;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
};

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  headerRight,
  children,
  isLoading,
  error,
  loadingComponent,
  errorComponent,
}) => {
  return (
    <Card>
      <Flex direction="row" gap="4" align="center" justify="between" py="2">
        <Heading size="3">{title}</Heading>
        {headerRight}
      </Flex>
      <Separator my="3" size="4" />

      {isLoading && (loadingComponent || <XSpinner message={`Loading ${title.toLowerCase()}...`} />)}

      {error &&
        (errorComponent || <GenericErrorCallout title={`Error loading ${title.toLowerCase()}`} error={error} />)}

      {!isLoading && !error && children}
    </Card>
  );
};
