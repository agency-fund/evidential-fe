'use client';
import { UsePaginationResult } from '@/providers/use-pagination';
import { PageSizeSelector } from '@/components/ui/pagination/page-size-selector';
import { PrevPageButton } from '@/components/ui/pagination/prev-page-button';
import { NextPageButton } from '@/components/ui/pagination/next-page-button';

interface PaginationButtonsProps {
  pagination: Pick<
    UsePaginationResult,
    'pageSize' | 'setPageSize' | 'hasPreviousPage' | 'goToPreviousPage' | 'goToNextPage'
  >;
  isLoading: boolean;
  nextPageToken: string | undefined;
}

export function PaginationButtons({ pagination, isLoading, nextPageToken }: PaginationButtonsProps) {
  return (
    <>
      <PageSizeSelector pagination={pagination} />
      <PrevPageButton pagination={pagination} isLoading={isLoading} />
      <NextPageButton pagination={pagination} nextPageToken={nextPageToken} isLoading={isLoading} />
    </>
  );
}
