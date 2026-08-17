'use client';

import { Flex, Text, TextField } from '@radix-ui/themes';
import { useEffect, useEffectEvent, useState } from 'react';
import { useDebounced } from '@/providers/use-debounced';

const getValidDraftN = (input: string): number | undefined => {
  const parsed = input === '' ? undefined : Number(input);
  // Allow 1 assuming it was typed as a leading 1 digit for a more stable UX.
  return parsed !== undefined && !isNaN(parsed) && parsed >= 1 ? parsed : undefined;
};

/** Input is valid if it's the empty string or a positive number. */
const isInvalidDraftN = (input: string): boolean => input !== '' && getValidDraftN(input) === undefined;

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
 * - `onChange`: latest callback called after debounce delay with a parsed positive integer, or
 * `undefined` for empty/invalid input.
 *
 * Input field sets a min of 2 preventing arrow keys from decrementing below, but a user can type in
 * 1 to allow it to be a leading digit. Parent should handle the special case of 1.
 */
export function PowerCheckDesiredNInput({ value, onChange, max, label, placeholder }: PowerCheckDesiredNInputProps) {
  const [draft, setDraft] = useState(() => ({ externalValue: value, value }));
  const notifyChange = useEffectEvent(onChange);
  if (value !== draft.externalValue) {
    setDraft({ externalValue: value, value });
  }

  const draftN = draft.value;
  const debouncedValidN = useDebounced(getValidDraftN(draftN), 400);
  const highlightInvalid = isInvalidDraftN(draftN);

  useEffect(() => {
    notifyChange(debouncedValidN);
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
        min={2}
        max={max}
        color={highlightInvalid ? 'red' : undefined}
        value={draftN}
        onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))}
        placeholder={placeholder ?? 'Enter your desired N'}
      />
    </Flex>
  );
}
