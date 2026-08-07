'use client';

import { Badge, Button, Flex, Separator, Text } from '@radix-ui/themes';
import { LayersIcon, Pencil2Icon, PersonIcon } from '@radix-ui/react-icons';
import { ArmBandit, CreateExperimentResponse, PriorTypes } from '@/api/methods.schemas';
import { isBanditSpec } from '@/services/experiment-utils';
import { SectionCard } from '@/components/ui/cards/section-card';
import { InfoBadge } from '@/components/ui/info-badge';
import { ReadMoreText } from '@/components/ui/read-more-text';

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
      {armWeight != null ? (
        <Badge color="gray" variant="soft">
          {armWeight.toFixed(1)}%
        </Badge>
      ) : null}
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
  const balanceOk = assignSummary?.balance_check?.balance_ok;
  const balanceBadge =
    balanceOk == null ? undefined : balanceOk ? (
      <InfoBadge
        label="Balanced"
        color="green"
        variant="soft"
        tooltip="A statistical check found your metric and strata values evenly distributed across the arms at assignment. See Design Details for the test results."
      />
    ) : (
      <InfoBadge
        label="Unbalanced"
        color="red"
        variant="soft"
        tooltip="A statistical check suggests your metric and strata values are unevenly distributed across the arms. See Design Details for the test results."
      />
    );
  const editButton = onEdit ? (
    <Button size="1" onClick={onEdit}>
      <Pencil2Icon />
      Edit
    </Button>
  ) : undefined;

  return (
    <SectionCard
      title="Treatment Arms"
      headerRight={
        balanceBadge || editButton ? (
          <Flex gap="3" align="center">
            {balanceBadge}
            {editButton}
          </Flex>
        ) : undefined
      }
    >
      <Flex direction="column" gap="4">
        {arms.map((arm, index) => {
          const armSize = assignSummary?.arm_sizes?.[index]?.size || 0;
          const clusterCount = assignSummary?.arm_sizes?.[index]?.cluster_count ?? undefined;
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
