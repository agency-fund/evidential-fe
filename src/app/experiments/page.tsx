'use client';
import { Badge, Button, Flex, Heading, Table } from '@radix-ui/themes';
import Link from 'next/link';
import { DownloadIcon, PlusIcon } from '@radix-ui/react-icons';

// Mock data for experiments
const experiments = [
  {
    id: '1',
    name: 'Sourdough Fermentation Time',
    status: 'ongoing',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    hypothesis: 'Extended fermentation times (24h vs 12h) will result in more complex flavor development',
  },
  {
    id: '2',
    name: 'Coffee Bean Roasting Temperature',
    status: 'completed',
    startDate: '2023-11-15',
    endDate: '2024-01-15',
    hypothesis: 'Higher roasting temperatures will produce more bitter compounds in light roast coffee',
  },
  {
    id: '3',
    name: 'Miso Aging Duration',
    status: 'ongoing',
    startDate: '2023-12-01',
    endDate: '2024-06-01',
    hypothesis: 'Longer aging periods will increase umami flavor compounds in miso paste',
  },
  {
    id: '4',
    name: 'Pizza Dough Hydration',
    status: 'pending',
    startDate: '2024-03-01',
    endDate: '2024-04-01',
    hypothesis: 'Higher hydration levels will improve crust texture in wood-fired pizza',
  },
  {
    id: '5',
    name: 'Chocolate Tempering Method',
    status: 'completed',
    startDate: '2023-10-01',
    endDate: '2023-12-31',
    hypothesis: 'Seeding method produces more consistent crystal formation than tabling method',
  },
];

const StatusBadge = ({ status }: { status: string }) => {
  const colorMap: Record<string, { color: 'orange' | 'green' | 'gray'; variant?: 'soft' | 'outline' }> = {
    ongoing: { color: 'orange' },
    completed: { color: 'green' },
    pending: { color: 'gray', variant: 'outline' },
  };

  const { color, variant = 'soft' } = colorMap[status];
  return (
    <Badge color={color} variant={variant}>
      {status}
    </Badge>
  );
};

export default function Page() {
  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center">
        <Heading>Experiments</Heading>
        <Button asChild>
          <Link href="/experiments/create">
            <PlusIcon /> Create Experiment
          </Link>
        </Button>
      </Flex>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Start Date</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>End Date</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell width="30%">Hypothesis</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {experiments.map((experiment) => (
            <Table.Row key={experiment.id}>
              <Table.Cell>{experiment.name}</Table.Cell>
              <Table.Cell>
                <StatusBadge status={experiment.status} />
              </Table.Cell>
              <Table.Cell>{experiment.startDate}</Table.Cell>
              <Table.Cell>{experiment.endDate}</Table.Cell>
              <Table.Cell>{experiment.hypothesis}</Table.Cell>
              <Table.Cell>
                <Flex direction={'row'} gap={'2'}>
                  <Button variant="soft" size="1">
                    View
                  </Button>
                  <Button variant="soft" size="1">
                    <DownloadIcon />
                    CSV
                  </Button>
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Flex>
  );
}
