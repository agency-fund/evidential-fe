'use client';
import { Select } from '@radix-ui/themes';
import { UsePaginationResult } from '@/providers/use-pagination';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

interface PageSizeSelectorProps {
  pagination: Pick<UsePaginationResult, 'pageSize' | 'setPageSize'>;
  options?: readonly number[];
}

export function PageSizeSelector({ pagination, options = DEFAULT_PAGE_SIZE_OPTIONS }: PageSizeSelectorProps) {
  return (
    <Select.Root value={String(pagination.pageSize)} onValueChange={(v) => pagination.setPageSize(Number(v))} size="1">
      <Select.Trigger />
      <Select.Content position="popper">
        {options.map((option) => (
          <Select.Item key={option} value={String(option)}>
            {option}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}
