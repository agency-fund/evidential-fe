'use client';
import { Button } from '@radix-ui/themes';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import { UsePaginationResult } from '@/providers/use-pagination';

interface NextPageButtonProps {
  pagination: Pick<UsePaginationResult, 'goToNextPage'>;
  nextPageToken: string | undefined;
  isLoading: boolean;
}

export function NextPageButton({ pagination, nextPageToken, isLoading }: NextPageButtonProps) {
  return (
    <Button
      size="1"
      variant="soft"
      color="gray"
      onClick={() => pagination.goToNextPage(nextPageToken)}
      disabled={!nextPageToken || isLoading}
      loading={isLoading}
    >
      Next
      <ChevronRightIcon />
    </Button>
  );
}
