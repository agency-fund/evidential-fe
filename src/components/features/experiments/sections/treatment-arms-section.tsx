'use client';

import {
  ArmBandit,
  CMABExperimentSpecOutput,
  CreateExperimentResponse,
  MABExperimentSpecOutput,
  PriorTypes,
} from '@/api/methods.schemas';
import { isClusterDesign } from '@/components/features/experiments/cluster-detection';
import { SectionCard } from '@/components/ui/cards/section-card';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { Pencil2Icon, PersonIcon } from '@radix-ui/react-icons';
import { Badge, Button, Flex, Separator, Text } from '@radix-ui/themes';

function isBanditExperiment(
  spec: CreateExperimentResponse['design_spec'],
): spec is MABExperimentSpecOutput | CMABExperimentSpecOutput {
  return spec.experiment_type === 'mab_online' || spec.experiment_type === 'cmab_online';
}

interface TreatmentArmsSectionProps {
  response: CreateExperimentResponse;
  onEdit?: () => void;
}

export function TreatmentArmsSection({ response, onEdit }: TreatmentArmsSectionProps) {
  const designSpec = response.design_spec;
  const arms = designSpec.arms;
  const assignSummary = response.assign_summary;
  const isBandit = isBanditExperiment(designSpec);
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
  // Issue #217: when this is a cluster-randomized experiment, show a green
  // "N clusters" badge alongside the participants badge for each arm
  // (UI4A). The per-arm cluster split lives on the stored power_analyses;
  // `isClusterDesign` falls back to power_analyses if the BE storage layer
  // dropped cluster_column from design_spec.
  const powerAnalyses = (
    response as {
      power_analyses?: {
        analyses?: Array<{
          clusters_per_arm?: number[] | null;
          num_clusters_total?: number | null;
        }>;
      };
    }
  ).power_analyses;
  const isClusterExperiment = isClusterDesign(designSpec, powerAnalyses);
  const firstAnalysis = powerAnalyses?.analyses?.[0];
  const clustersPerArm = firstAnalysis?.clusters_per_arm ?? null;
  const totalClusters = firstAnalysis?.num_clusters_total ?? null;
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
          // Prefer per-arm cluster counts from power_analyses; fall back to
          // splitting num_clusters_total evenly across arms if the BE
          // returned a total but no per-arm breakdown.
          let armClusters: number | undefined;
          if (isClusterExperiment) {
            if (clustersPerArm && clustersPerArm.length === arms.length) {
              armClusters = clustersPerArm[index];
            } else if (totalClusters != null && arms.length > 0) {
              armClusters = Math.floor(totalClusters / arms.length);
            }
          }
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
                <Flex align="center" gap="2" wrap="wrap">
                  {armClusters != null && (
                    <Badge color="green">
                      <Text>{armClusters.toLocaleString()} clusters</Text>
                    </Badge>
                  )}
                  {armSize > 0 && (
                    <Badge>
                      <PersonIcon />
                      <Text>{armSize.toLocaleString()} participants</Text>
                    </Badge>
                  )}
                  <Badge>{arm.arm_weight == null ? 'balanced' : `${arm.arm_weight.toFixed(1)}%`}</Badge>
                </Flex>
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
