'use client';

import { TextField } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { useDebounced } from '@/providers/use-debounced';

function getValidDraftN(input: string): number | undefined {
  const parsed = input === '' ? undefined : Number(input);
  return parsed !== undefined && !isNaN(parsed) && parsed > 0 ? parsed : undefined;
}

interface PowerCheckDesiredNInputProps {
  value: string;
  onChange: (debouncedValidN: number | undefined) => void;
  max?: number;
}

export function PowerCheckDesiredNInput({ value, onChange, max }: PowerCheckDesiredNInputProps) {
  const [draftN, setDraftN] = useState(value);
  const debouncedValidN = useDebounced(getValidDraftN(draftN), 400);

  useEffect(() => {
    setDraftN(value);
  }, [value]);

  useEffect(() => {
    onChange(debouncedValidN);
  }, [debouncedValidN, onChange]);

  return (
    <TextField.Root
      style={{ width: '150px' }}
      size="2"
      type="number"
      min={1}
      max={max}
      value={draftN}
      onChange={(e) => setDraftN(e.target.value)}
      placeholder="Enter your desired N"
    />
  );
}
