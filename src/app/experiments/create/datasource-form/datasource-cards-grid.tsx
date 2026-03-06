'use client';
import { Flex, RadioCards, Text } from '@radix-ui/themes';
import { DatasourceSummary } from '@/api/methods.schemas';

interface DatasourceCardsGridProps {
  datasources: DatasourceSummary[];
  selectedDatasourceId?: string;
  onSelect: (datasourceId: string) => void;
}

const getDriverDisplayName = (driver: string) => {
  switch (driver) {
    case 'bigquery':
      return 'Google BigQuery';
    case 'postgresql+psycopg':
      return 'PostgreSQL';
    case 'postgresql+psycopg2':
      return 'Redshift';
    default:
      return driver;
  }
};

export const DatasourceCardsGrid = ({ datasources, selectedDatasourceId, onSelect }: DatasourceCardsGridProps) => (
  <RadioCards.Root columns="4" gap="3" value={selectedDatasourceId} onValueChange={onSelect}>
    {datasources.map((ds) => (
      <RadioCards.Item key={ds.id} value={ds.id}>
        <Flex direction="column" gap="1">
          <Text weight="bold">{ds.name}</Text>
          <Text size="2" color="gray">
            {getDriverDisplayName(ds.driver)}
          </Text>
        </Flex>
      </RadioCards.Item>
    ))}
  </RadioCards.Root>
);
