'use client';

import { Badge, Button, Flex, Separator, Text } from '@radix-ui/themes';
import { LayersIcon, Pencil2Icon, PersonIcon } from '@radix-ui/react-icons';
import { ArmBandit, CreateExperimentResponse, PriorTypes } from '@/api/methods.schemas';
import {
  isClusteredPreassignedSpec,
  isBanditSpec,
} from '@/app/experiments/create/experiment-form/experiment-form-types';
import { SectionCard } from '@/components/ui/cards/section-card';
import { ReadMoreText } from '@/components/ui/read-more-text';

function getPrimaryMetricClustersPerArm(response: CreateExperimentResponse): number[] | undefined {
  const designSpec = response.design_spec;
  if (!isClusteredPreassignedSpec(designSpec)) {
    return undefined;
  }

  const primaryMetricFieldName = designSpec.metrics[0]?.field_name;
  const primaryAnalysis =
    response.power_analyses?.analyses.find((analysis) => analysis.metric_spec.field_name === primaryMetricFieldName) ??
    response.power_analyses?.analyses[0];

  return primaryAnalysis?.clusters_per_arm ?? undefined;
}

interface ArmAssignmentBadgesProps {
  armSize: number;
  clusterCount: number | undefined;
  armWeight: number | undefined;
}

function ArmAssignmentBadges({ armSize, clusterCount, armWeight }: ArmAssignmentBadgesProps) {
  return (
    <Flex align="center" gap="2" wrap="wrap">
      {clusterCount !== undefined && clusterCount > 0 && (
        <Badge color="green" variant="soft">
          <LayersIcon />
          {clusterCount.toLocaleString()} clusters
        </Badge>
      )}
      {armSize > 0 && (
        <Badge color="blue" variant="soft">
          <PersonIcon />
          {armSize.toLocaleString()} participants
        </Badge>
      )}
      <Badge color="gray" variant="soft">
        {armWeight == null ? 'balanced' : `${armWeight.toFixed(1)}%`}
      </Badge>
    </Flex>
  );
}

interface TreatmentArmsSectionProps {
  response: CreateExperimentResponse;
  onEdit?: () => void;
}

export function TreatmentArmsSection({ response, onEdit }: TreatmentArmsSectionProps) {
  const designSpec = response.design_spec;
  const arms = designSpec.arms;
  const assignSummary = response.assign_summary;
  const clustersPerArm = getPrimaryMetricClustersPerArm(response);
  const isBandit = isBanditSpec(designSpec);
  const priorType: PriorTypes | undefined = isBandit ? designSpec.prior_type : undefined;
  const isBetaPrior = priorType === 'beta';

  if (isBandit) {
    return (
      <SectionCard
        title="Treatment Arms"
        headerRight={
          onEdit ? (
            <Button size="1" onClick={onEdit}>
              <Pencil2Icon />
              Edit
            </Button>
          ) : undefined
        }
      >
        <Flex direction="column" gap="4">
          {arms.map((arm, index) => {
            const banditArm = arm as ArmBandit;
            return (
              <Flex key={index} direction="column" gap="2">
                <Flex align="center" justify="between" gap="3" wrap="wrap">
                  <Flex align="center" gap="2" wrap="wrap">
                    <Text weight="bold">{banditArm.arm_name}</Text>
                    {index === 0 && !isBandit ? (
                      <Text size="1" color="gray">
                        (Control)
                      </Text>
                    ) : null}
                  </Flex>
                  <Flex align="center" gap="2" wrap="wrap">
                    {isBetaPrior ? (
                      <>
                        <Badge>α = {banditArm.alpha_init?.toFixed(2) ?? 'Not set'}</Badge>
                        <Badge>β ={banditArm.beta_init?.toFixed(2) ?? 'Not set'}</Badge>
                      </>
                    ) : (
                      <>
                        <Badge>μ = {banditArm.mu_init?.toFixed(2) ?? 'Not set'}</Badge>
                        <Badge>σ = {banditArm.sigma_init?.toFixed(2) ?? 'Not set'}</Badge>
                      </>
                    )}
                  </Flex>
                </Flex>
                <ReadMoreText text={banditArm.arm_description || '-'} />
                {index < arms.length - 1 && <Separator size="4" />}
              </Flex>
            );
          })}
        </Flex>
      </SectionCard>
    );
  }

  // Frequentist experiment display
  return (
    <SectionCard
      title="Treatment Arms"
      headerRight={
        onEdit ? (
          <Button size="1" onClick={onEdit}>
            <Pencil2Icon />
            Edit
          </Button>
        ) : undefined
      }
    >
      <Flex direction="column" gap="4">
        {arms.map((arm, index) => {
          const armSize = assignSummary?.arm_sizes?.[index]?.size || 0;
          const clusterCount = clustersPerArm?.[index];
          const armWeight = arm.arm_weight ?? undefined;

          return (
            <Flex key={index} direction="column" gap="2">
              <Flex align="center" justify="between" gap="3" wrap="wrap">
                <Flex align="center" gap="2" wrap="wrap">
                  <Text weight="bold">{arm.arm_name}</Text>
                  {index === 0 && (
                    <Text size="1" color="gray">
                      (Control)
                    </Text>
                  )}
                </Flex>
                <ArmAssignmentBadges armSize={armSize} clusterCount={clusterCount} armWeight={armWeight} />
              </Flex>
              <ReadMoreText text={arm.arm_description || '-'} />
              {index < arms.length - 1 && <Separator size="4" />}
            </Flex>
          );
        })}
      </Flex>
    </SectionCard>
  );
}
