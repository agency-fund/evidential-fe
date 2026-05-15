'use client';

import { Badge, Button, DataList, Dialog, Flex, Separator, Text } from '@radix-ui/themes';
import { Pencil2Icon, PersonIcon } from '@radix-ui/react-icons';
import {
  ArmBandit,
  CMABExperimentSpecOutput,
  CreateExperimentResponse,
  MABExperimentSpecOutput,
  PriorTypes,
} from '@/api/methods.schemas';
import { SectionCard } from '@/components/ui/cards/section-card';
import { ReadMoreText } from '@/components/ui/read-more-text';

function isBanditExperiment(
  spec: CreateExperimentResponse['design_spec'],
): spec is MABExperimentSpecOutput | CMABExperimentSpecOutput {
  return spec.experiment_type === 'mab_online' || spec.experiment_type === 'cmab_online';
}

interface TreatmentArmsSectionProps {
  response: CreateExperimentResponse;
  onEdit?: () => void;
}
function BalanceCheckDialog({ assignSummary }: { assignSummary: CreateExperimentResponse['assign_summary'] }) {
  const balanceCheck = assignSummary?.balance_check;
  if (!balanceCheck) return null;

  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Badge style={{ cursor: 'pointer' }}>Balance Check</Badge>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="400px">
        <Dialog.Title>Balance Check</Dialog.Title>
        <DataList.Root>
          <DataList.Item>
            <DataList.Label>F Statistic</DataList.Label>
            <DataList.Value>{balanceCheck.f_statistic.toFixed(3)}</DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>Numerator DF</DataList.Label>
            <DataList.Value>{balanceCheck.numerator_df}</DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>Denominator DF</DataList.Label>
            <DataList.Value>{balanceCheck.denominator_df}</DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>P-Value</DataList.Label>
            <DataList.Value>{balanceCheck.p_value.toFixed(3)}</DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>Balance OK?</DataList.Label>
            <DataList.Value>{balanceCheck.balance_ok ? 'Yes' : 'No'}</DataList.Value>
          </DataList.Item>
        </DataList.Root>
        <Dialog.Close>
          <Button mt="4" variant="soft">Close</Button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  );
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

  return (
    <SectionCard
      title="Treatment Arms"
      headerRight={
        <Flex align="center" gap="2">
          <BalanceCheckDialog assignSummary={assignSummary} />
          {onEdit && (
            <Button size="1" onClick={onEdit}>
              <Pencil2Icon />
              Edit
            </Button>
          )}
        </Flex>
      }
    >
      <Flex direction="column" gap="4">
        {arms.map((arm, index) => {
          const armSize = assignSummary?.arm_sizes?.[index]?.size || 0;
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
