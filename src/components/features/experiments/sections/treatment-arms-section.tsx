'use client';

import { Badge, Flex, Table, Text } from '@radix-ui/themes';
import { PersonIcon } from '@radix-ui/react-icons';
import { CreateExperimentResponse } from '@/api/methods.schemas';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { SectionCard } from '@/components/ui/cards/section-card';
import { ReadMoreText } from '@/components/ui/read-more-text';

export function TreatmentArmsSection({ response }: { response: CreateExperimentResponse }) {
  const arms = response.design_spec.arms;
  const assignSummary = response.assign_summary;

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
