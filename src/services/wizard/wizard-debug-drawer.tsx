'use client';
import { useState } from 'react';
import { BreadcrumbInfo } from './wizard-types';
import { Badge, Box, Card, Flex, IconButton, ScrollArea, Separator, Text } from '@radix-ui/themes';
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import { Preformatted } from '@/components/ui/preformatted';

const DebugBreadcrumb = ({ breadcrumb }: { breadcrumb: BreadcrumbInfo }) => {
  return breadcrumb.type === 'screen' && breadcrumb.clickable ? (
    <Text color="blue">{breadcrumb.screenId}</Text>
  ) : breadcrumb.type === 'screen' && !breadcrumb.clickable ? (
    <Text color="gray">{breadcrumb.screenId}</Text>
  ) : (
    <Text color="red">unknown</Text>
  );
};

type DebugDrawerProps<FormData> = {
  data: FormData;
  breadcrumbs: Array<BreadcrumbInfo>;
  currentScreenId: string;
};

export function DebugDrawer<FormData>({ data, breadcrumbs, currentScreenId }: DebugDrawerProps<FormData>) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <Card
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderRadius: 0,
        }}
      >
        <Flex justify="between" align="center" px="3" py="1">
          <Text size="1">Debug Panel</Text>
          <IconButton size="1" variant="ghost" onClick={() => setIsOpen(true)}>
            <ChevronUpIcon />
          </IconButton>
        </Flex>
      </Card>
    );
  }

  return (
    <Card
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        maxHeight: '40vh',
        borderRadius: 0,
      }}
    >
      <Flex justify="between" align="center" px="3" py="2">
        <Flex gap="3" align="center">
          <Text size="2" weight="bold">
            Debug Panel
          </Text>
          <Text size="1" color="gray">
            Screen: {currentScreenId}
          </Text>
        </Flex>
        <IconButton size="1" variant="ghost" onClick={() => setIsOpen(false)}>
          <ChevronDownIcon />
        </IconButton>
      </Flex>

      <Separator size="4" />

      <ScrollArea style={{ maxHeight: 'calc(40vh - 40px)' }}>
        <Box p="3">
          <Flex direction="column" gap="3">
            <Box>
              <Text size="1" weight="bold" color="gray">
                Breadcrumbs
              </Text>
              <Flex gap="2" mt="1" wrap="wrap">
                {breadcrumbs.map((bc, i) => (
                  <Badge key={i} variant="soft">
                    <DebugBreadcrumb breadcrumb={bc} />
                  </Badge>
                ))}
              </Flex>
            </Box>

            <Box>
              <Text size="1" weight="bold" color="gray">
                Form Data
              </Text>
              <Card mt="1">
                <Preformatted content={data as object} />
              </Card>
            </Box>
          </Flex>
        </Box>
      </ScrollArea>
    </Card>
  );
}
