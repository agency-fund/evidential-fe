'use client';
import React, { createContext, PropsWithChildren, useContext } from 'react';
import { Box, Card, Flex, Text } from '@radix-ui/themes';
import { BreadcrumbInfo } from './wizard-types';
import { ChevronRightIcon, DotsHorizontalIcon } from '@radix-ui/react-icons';

type WizardBreadcrumbsContextType = {
  breadcrumbs: Array<BreadcrumbInfo>;
  currentScreenId: string;
  onNavigate: (screenId: string) => void;
};

const WizardBreadcrumbsContext = createContext<WizardBreadcrumbsContextType | null>(null);

export function useWizardBreadcrumbs(): WizardBreadcrumbsContextType {
  const context = useContext(WizardBreadcrumbsContext);
  if (!context) {
    throw new Error('useWizardBreadcrumbs must be used within a WizardBreadcrumbsProvider');
  }
  return context;
}

type WizardBreadcrumbsProviderProps = PropsWithChildren<WizardBreadcrumbsContextType>;

export function WizardBreadcrumbsProvider({
  children,
  breadcrumbs,
  currentScreenId,
  onNavigate,
}: WizardBreadcrumbsProviderProps) {
  return (
    <WizardBreadcrumbsContext.Provider value={{ breadcrumbs, currentScreenId, onNavigate }}>
      {children}
    </WizardBreadcrumbsContext.Provider>
  );
}

type OnNavigateAway = (targetScreenId: string, currentScreenId: string) => void | boolean | Promise<void | boolean>;

interface WizardBreadcrumbsProps {
  onNavigateAway?: OnNavigateAway;
}

export function WizardBreadcrumbs({ onNavigateAway }: WizardBreadcrumbsProps = {}) {
  const { breadcrumbs, currentScreenId, onNavigate } = useWizardBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Card size="1">
      <Flex align="center" gap="2" wrap="wrap">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem
              crumb={crumb}
              currentScreenId={currentScreenId}
              isCurrent={crumb.type === 'screen' && crumb.screenId === currentScreenId}
              onNavigate={onNavigate}
              onNavigateAway={onNavigateAway}
            />
            {index < breadcrumbs.length - 1 && <ChevronRightIcon color="var(--gray-9)" />}
          </React.Fragment>
        ))}
      </Flex>
    </Card>
  );
}

interface BreadcrumbItemProps {
  crumb: BreadcrumbInfo;
  currentScreenId: string;
  isCurrent: boolean;
  onNavigate: (screenId: string) => void;
  onNavigateAway?: OnNavigateAway;
}

function BreadcrumbItem({ crumb, currentScreenId, isCurrent, onNavigate, onNavigateAway }: BreadcrumbItemProps) {
  if (crumb.type === 'unknown') {
    return <DotsHorizontalIcon color="var(--gray-9)" />;
  }

  const label = crumb.label;
  const isClickable = crumb.clickable && !isCurrent;
  const handleClick = async () => {
    if (!isClickable) {
      return;
    }

    if (onNavigateAway) {
      const result = await onNavigateAway(crumb.screenId, currentScreenId);
      if (result === false) {
        return;
      }
    }

    onNavigate(crumb.screenId);
  };

  return (
    <Box
      px="2"
      style={{
        borderRadius: 'var(--radius-1)',
        cursor: isClickable ? 'pointer' : 'default',
        backgroundColor: isCurrent ? 'var(--accent-3)' : 'transparent',
      }}
      onClick={isClickable ? handleClick : undefined}
    >
      <Text
        size="2"
        weight={isCurrent ? 'bold' : 'regular'}
        color={isCurrent ? undefined : isClickable ? 'blue' : 'gray'}
      >
        {label}
      </Text>
    </Box>
  );
}
