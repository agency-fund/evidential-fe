'use client';

import { Button, Card, DataList, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { InspectParticipantTypesResponse } from '@/api/methods.schemas';
import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { DataTypeBadge } from '@/components/ui/data-type-badge';

export function InspectParticipantTypesSummary({ data }: { data: InspectParticipantTypesResponse | undefined }) {
  const [showStrata, setShowStrata] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

  if (!data) return null;

  return (
    <Flex direction="column" gap="4">
      <Flex align="center" gap="2" mb="2">
        <Button variant="ghost" onClick={() => setShowStrata(!showStrata)}>
          {showStrata ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </Button>
        <Heading size="4">Strata Fields</Heading>
      </Flex>
      {showStrata &&
        (data.strata.length === 0 ? (
          <Text>There are no strata fields defined.</Text>
        ) : (
          <Grid columns="3" gap="4">
            {data.strata.map((field) => (
              <Card key={field.field_name}>
                <DataList.Root key={field.field_name}>
                  <DataList.Item>
                    <DataList.Label minWidth="120px">Field Name</DataList.Label>
                    <DataList.Value>{field.field_name}</DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="120px">Description</DataList.Label>
                    <DataList.Value>{field.description}</DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="120px">Data Type</DataList.Label>
                    <DataList.Value>
                      <DataTypeBadge type={field.data_type} />
                    </DataList.Value>
                  </DataList.Item>
                </DataList.Root>
              </Card>
            ))}
          </Grid>
        ))}
      <Flex align="center" gap="2" mb="2">
        <Button variant="ghost" onClick={() => setShowMetrics(!showMetrics)}>
          {showMetrics ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </Button>
        <Heading size="4">Metrics Fields</Heading>
      </Flex>
      {showMetrics &&
        (data.metrics.length === 0 ? (
          <Text>There are no metrics defined.</Text>
        ) : (
          <Grid columns="3" gap="4" width={'auto'}>
            {data.metrics.map((field) => (
              <Card key={field.field_name}>
                <DataList.Root>
                  <DataList.Item>
                    <DataList.Label minWidth="120px">Field Name</DataList.Label>
                    <DataList.Value>{field.field_name}</DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="120px">Description</DataList.Label>
                    <DataList.Value>{field.description}</DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="120px">Data Type</DataList.Label>
                    <DataList.Value>
                      <DataTypeBadge type={field.data_type} />
                    </DataList.Value>
                  </DataList.Item>
                </DataList.Root>
              </Card>
            ))}
          </Grid>
        ))}

      <Flex align="center" gap="2" mb="2">
        <Button variant="ghost" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </Button>
        <Heading size="4">Filter Fields</Heading>
      </Flex>
      {showFilters &&
        (data.filters.length === 0 ? (
          <Text>There are no filters defined.</Text>
        ) : (
          <Grid columns="3" gap="4">
            {data.filters.map((field) => (
              <Card key={field.field_name}>
                <DataList.Root key={field.field_name}>
                  <DataList.Item>
                    <DataList.Label minWidth="120px">Field Name</DataList.Label>
                    <DataList.Value>{field.field_name}</DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="120px">Description</DataList.Label>
                    <DataList.Value>{field.description}</DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="120px">Data Type</DataList.Label>
                    <DataList.Value>
                      <DataTypeBadge type={field.data_type} />
                    </DataList.Value>
                  </DataList.Item>
                  {'min' in field && (
                    <>
                      <DataList.Item>
                        <DataList.Label>Lower Bound</DataList.Label>
                        <DataList.Value>{field.min}</DataList.Value>
                      </DataList.Item>
                      <DataList.Item>
                        <DataList.Label minWidth="120px">Upper Bound</DataList.Label>
                        <DataList.Value>{field.max}</DataList.Value>
                      </DataList.Item>
                    </>
                  )}
                  {'distinct_values' in field && field.distinct_values && (
                    <DataList.Item>
                      <DataList.Label minWidth="120px">Valid Values</DataList.Label>
                      <DataList.Value>
                        {field.distinct_values.length > 15
                          ? field.distinct_values.slice(0, 14).join(', ') + ', ...'
                          : field.distinct_values.join(', ')}
                      </DataList.Value>
                    </DataList.Item>
                  )}
                </DataList.Root>
              </Card>
            ))}
          </Grid>
        ))}
    </Flex>
  );
}
