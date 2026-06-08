'use client';

import { TextField } from '@radix-ui/themes';
import { useEffect, useRef, useState } from 'react';
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
  // Guard against the onChange function changing between debounce calls with a ref.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const debouncedValidN = useDebounced(getValidDraftN(draftN), 400);

  // Allow updates to the input due to prop changes, as can happen if the user chose all samples.
  useEffect(() => {
    setDraftN(value);
  }, [value]);

  useEffect(() => {
    onChangeRef.current(debouncedValidN);
  }, [debouncedValidN]);

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
