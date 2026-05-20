'use client';
import { Button } from '@radix-ui/themes';
import { ChevronLeftIcon } from '@radix-ui/react-icons';
import { UsePaginationResult } from '@/providers/use-pagination';

interface PrevPageButtonProps {
  pagination: Pick<UsePaginationResult, 'hasPreviousPage' | 'goToPreviousPage'>;
  isLoading: boolean;
}

export function PrevPageButton({ pagination, isLoading }: PrevPageButtonProps) {
  return (
    <Button
      size="1"
      variant="soft"
      color="gray"
      onClick={pagination.goToPreviousPage}
      disabled={!pagination.hasPreviousPage || isLoading}
      loading={isLoading}
    >
      <ChevronLeftIcon />
      Prev
    </Button>
  );
}
