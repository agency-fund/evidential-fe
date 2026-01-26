'use client';

import { Badge, Flex, Table, Text } from '@radix-ui/themes';
import { PersonIcon } from '@radix-ui/react-icons';
import {
  ArmBandit,
  CMABExperimentSpecOutput,
  CreateExperimentResponse,
  MABExperimentSpecOutput,
  PriorTypes,
} from '@/api/methods.schemas';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { SectionCard } from '@/components/ui/cards/section-card';
import { ReadMoreText } from '@/components/ui/read-more-text';

function isBanditExperiment(
  spec: CreateExperimentResponse['design_spec'],
): spec is MABExperimentSpecOutput | CMABExperimentSpecOutput {
  return spec.experiment_type === 'mab_online' || spec.experiment_type === 'cmab_online';
}

export function TreatmentArmsSection({ response }: { response: CreateExperimentResponse }) {
  const designSpec = response.design_spec;
  const arms = designSpec.arms;
  const assignSummary = response.assign_summary;
  const isBandit = isBanditExperiment(designSpec);
  const priorType: PriorTypes | undefined = isBandit ? designSpec.prior_type : undefined;
  const isBetaPrior = priorType === 'beta';

  if (isBandit) {
    return (
      <SectionCard title="Treatment Arms">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
              {isBetaPrior ? (
                <>
                  <Table.ColumnHeaderCell>Alpha Prior</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Beta Prior</Table.ColumnHeaderCell>
                </>
              ) : (
                <>
                  <Table.ColumnHeaderCell>Mean Prior</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Std Dev Prior</Table.ColumnHeaderCell>
                </>
              )}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {arms.map((arm, index) => {
              const banditArm = arm as ArmBandit;
              return (
                <Table.Row key={index}>
                  <Table.Cell>
                    <Flex gap="2" align="center">
                      <Text>{banditArm.arm_id}</Text>
                      <CopyToClipBoard content={banditArm.arm_id!} />
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Text weight="bold">{banditArm.arm_name} </Text>
                    {index === 0 && (
                      <Text size="1" color="gray">
                        (Control)
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <ReadMoreText text={banditArm.arm_description || '-'} />
                  </Table.Cell>
                  {isBetaPrior ? (
                    <>
                      <Table.Cell>{banditArm.alpha_init ?? 1}</Table.Cell>
                      <Table.Cell>{banditArm.beta_init ?? 1}</Table.Cell>
                    </>
                  ) : (
                    <>
                      <Table.Cell>{banditArm.mu_init ?? 0}</Table.Cell>
                      <Table.Cell>{banditArm.sigma_init ?? 1}</Table.Cell>
                    </>
                  )}
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </SectionCard>
    );
  }

  // Frequentist experiment display
  return (
    <SectionCard title="Treatment Arms">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Target Allocation</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {arms.map((arm, index) => {
            const armSize = assignSummary?.arm_sizes?.[index]?.size || 0;
            return (
              <Table.Row key={index}>
                <Table.Cell>
                  <Flex gap="2" align="center">
                    <Text>{arm.arm_id}</Text>
                    <CopyToClipBoard content={arm.arm_id!} />
                  </Flex>
                </Table.Cell>
                <Table.Cell>
                  <Flex direction="column" gap="2" align="start">
                    {armSize > 0 && (
                      <Badge>
                        <PersonIcon />
                        <Text>{armSize.toLocaleString()} participants</Text>
                      </Badge>
                    )}
                    <Badge>{arm.arm_weight == null ? 'balanced' : `${arm.arm_weight.toFixed(1)}%`}</Badge>
                  </Flex>
                </Table.Cell>
                <Table.Cell>{arm.arm_name}</Table.Cell>
                <Table.Cell>
                  <ReadMoreText text={arm.arm_description || '-'} />
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </SectionCard>
  );
}
