'use client';
import { Box, Button, Card, Flex, Heading, Text } from '@radix-ui/themes';

interface EmptyStateCardProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const EmptyStateCard = ({
  title,
  description,
  buttonText,
  buttonIcon,
  onClick,
  children,
}: EmptyStateCardProps) => {
  return (
    <Box>
      <Card>
        <Flex justify="center" direction="column" align="center" py="6" gap="4">
          <Flex justify="center" align="center" gap="2" direction="column">
            <Heading size="5">{title}</Heading>
            <Text as="p" size="2" color="gray">
              {description}
            </Text>
          </Flex>
          {buttonText && onClick && (
            <Button onClick={onClick}>
              {buttonIcon}
              {buttonText}
            </Button>
          )}
          {children}
        </Flex>
      </Card>
    </Box>
  );
};
