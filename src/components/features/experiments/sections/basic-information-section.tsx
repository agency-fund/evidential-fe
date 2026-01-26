'use client';

import { Flex, Table, Text } from '@radix-ui/themes';
import Link from 'next/link';
import { CreateExperimentResponse } from '@/api/methods.schemas';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { SectionCard } from '@/components/ui/cards/section-card';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { formatIsoDateLocal } from '@/services/date-utils';

export function BasicInformationSection({ response }: { response: CreateExperimentResponse }) {
  const designSpec = response.design_spec;

  return (
    <SectionCard title="Basic Information">
      <Table.Root>
        <Table.Body>
          <Table.Row>
            <Table.RowHeaderCell>Experiment ID</Table.RowHeaderCell>
            <Table.Cell>
              <Flex gap="2" align="center">
                <Text>{response.experiment_id}</Text>
                <CopyToClipBoard content={response.experiment_id} />
              </Flex>
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>Experiment Type</Table.RowHeaderCell>
            <Table.Cell>{designSpec.experiment_type}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>Participant Type</Table.RowHeaderCell>
            <Table.Cell>{designSpec.participant_type || '-'}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>Name</Table.RowHeaderCell>
            <Table.Cell>{designSpec.experiment_name}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>Hypothesis</Table.RowHeaderCell>
            <Table.Cell>
              <ReadMoreText text={designSpec.description || '-'} />
            </Table.Cell>
          </Table.Row>
          {designSpec.design_url && (
            <Table.Row>
              <Table.RowHeaderCell>Design Document URL</Table.RowHeaderCell>
              <Table.Cell>
                <Link href={designSpec.design_url} target="_blank" rel="noopener noreferrer">
                  {designSpec.design_url}
                </Link>
              </Table.Cell>
            </Table.Row>
          )}
          <Table.Row>
            <Table.RowHeaderCell>Start Date</Table.RowHeaderCell>
            <Table.Cell>{designSpec.start_date ? formatIsoDateLocal(designSpec.start_date) : '-'}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>End Date</Table.RowHeaderCell>
            <Table.Cell>{designSpec.end_date ? formatIsoDateLocal(designSpec.end_date) : '-'}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </SectionCard>
  );
}
