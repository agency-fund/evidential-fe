'use client';

import { Flex, Text, TextField } from '@radix-ui/themes';
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
  label?: string;
  placeholder?: string;
}

/**
 * Semi-controlled number input with local draft state and debounced commits.
 *
 * - `value`: external sync/reset string (e.g. when parent changes desiredN from outside typing).
 * - `onChange`: latest ref called after debounce delay with a parsed positive integer, or
 * `undefined` for empty/invalid input.
 */
export function PowerCheckDesiredNInput({ value, onChange, max, label, placeholder }: PowerCheckDesiredNInputProps) {
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
    <Flex direction="column" gap="1" align="start">
      {label ? (
        <Text as="label" size="1" weight="medium">
          {label}
        </Text>
      ) : null}
      <TextField.Root
        style={{ width: '150px' }}
        size="2"
        type="number"
        min={1}
        max={max}
        value={draftN}
        onChange={(e) => setDraftN(e.target.value)}
        placeholder={placeholder ?? 'Enter your desired N'}
      />
    </Flex>
  );
}
