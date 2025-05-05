'use client';
import { Box, Button, Card, Flex, Heading, Text } from '@radix-ui/themes';

interface EmptyStateCardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonIcon?: React.ReactNode;
  onClick: () => void;
}

export const EmptyStateCard = ({ title, description, buttonText, buttonIcon, onClick }: EmptyStateCardProps) => {
  return (
    <Box mt="6">
      <Card>
        <Flex justify="center" direction="column" align="center" py="6" gap="4">
          <Flex justify="center" align="center" gap="2" direction="column">
            <Heading size="5">{title}</Heading>
            <Text as="p" size="2" color="gray">
              {description}
            </Text>
          </Flex>
          <Button onClick={onClick}>
            {buttonIcon}
            {buttonText}
          </Button>
        </Flex>
      </Card>
    </Box>
  );
};
