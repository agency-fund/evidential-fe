/**
 * Enhanced Experiment Creation Flow Architecture
 * --------------------------------------------
 * This page implements a multi-type, multi-stage form for creating experiments.
 *
 * Key improvements:
 * - Support for 4 experiment types: Traditional A/B, MAB, Bayesian A/B, Contextual Bandit
 * - Adaptive navigation and breadcrumbs based on experiment type
 * - Type-specific form flows and validation
 * - Component-based architecture for maintainability
 *
 * The flow now includes:
 * 1. Experiment Type Selection: Choose from 4 experiment types
 * 2. Type-specific flows:
 *    - Traditional A/B: Assignment → Metadata → Design → Summary
 *    - MAB: Metadata → Design → Summary
 *    - Bayesian A/B: Metadata → Design → Summary
 *    - CMAB: Metadata → Design → Context → Summary
 */

'use client';
import React from 'react';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { useListOrganizationWebhooks } from '@/api/admin';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { CreateExperimentContainer } from './containers/create-experiment-container';

// Main page component that handles loading state and error handling
export default function CreateExperimentPage() {
  const org = useCurrentOrganization();

  // Fetch webhooks for experiment notifications
  const { data, isLoading, error } = useListOrganizationWebhooks(org!.current.id, {
    swr: {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
    },
  });

  if (isLoading) {
    return <XSpinner message="Loading webhooks..." />;
  }

  if (error || org === null) {
    return <GenericErrorCallout title={'An error occurred while loading webhooks.'} error={error} />;
  }

  return <CreateExperimentContainer webhooks={data!.items} />;
}
