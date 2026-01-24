'use client';
import React, { createContext, PropsWithChildren, useContext } from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
import { BreadcrumbInfo } from './wizard-types';
import { ScreenInventory, ExperimentScreenId } from '@/app/experiments/create/experiment-form-def';

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

export function WizardBreadcrumbs() {
  const { breadcrumbs, currentScreenId, onNavigate } = useWizardBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Box
      mb="5"
      px="4"
      py="3"
      style={{
        backgroundColor: 'var(--gray-2)',
        border: '1px solid var(--gray-6)',
        borderRadius: 'var(--radius-2)',
      }}
    >
      <Flex align="center" gap="2" wrap="wrap">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem
              crumb={crumb}
              isCurrent={crumb.type === 'screen' && crumb.screenId === currentScreenId}
              onNavigate={onNavigate}
            />
            {index < breadcrumbs.length - 1 && (
              <Text size="2" color="gray">
                /
              </Text>
            )}
          </React.Fragment>
        ))}
      </Flex>
    </Box>
  );
}

interface BreadcrumbItemProps {
  crumb: BreadcrumbInfo;
  isCurrent: boolean;
  onNavigate: (screenId: string) => void;
}

function BreadcrumbItem({ crumb, isCurrent, onNavigate }: BreadcrumbItemProps) {
  if (crumb.type === 'unknown') {
    return (
      <Text size="2" color="gray">
        ...
      </Text>
    );
  }

  const label = ScreenInventory[crumb.screenId as ExperimentScreenId] || crumb.screenId;
  const isClickable = crumb.clickable && !isCurrent;

  return (
    <Box
      style={{
        padding: '4px 8px',
        borderRadius: 'var(--radius-1)',
        cursor: isClickable ? 'pointer' : 'default',
        backgroundColor: isCurrent ? 'var(--accent-3)' : 'transparent',
      }}
      onClick={isClickable ? () => onNavigate(crumb.screenId) : undefined}
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
