'use client';
import { Text, TextArea, Callout } from '@radix-ui/themes';
import { gcpServiceAccountSchema } from '@/services/gcp-schema';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useState } from 'react';

interface ServiceAccountJsonFieldProps {
  value: string;
  onChange: (value: string) => void;
  onProjectIdFound?: (projectId: string) => void;
}

export function ServiceAccountJsonField({ value, onChange, onProjectIdFound }: ServiceAccountJsonFieldProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      const result = gcpServiceAccountSchema.safeParse(parsed);
      if (!result.success) {
        const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
        setValidationError('Invalid service account key format: ' + errors);
        return false;
      }
      setValidationError(null);
      return true;
    } catch {
      setValidationError('Invalid JSON format');
      return false;
    }
  };

  const handleCredentialsPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    try {
      const parsedJson = JSON.parse(pastedText);
      if (typeof parsedJson.project_id === 'string' && onProjectIdFound) {
        onProjectIdFound(parsedJson.project_id);
      }
    } catch {
      // If JSON parsing fails, do nothing
    }
  };

  return (
    <label>
      <Text as="div" size="2" mb="1" weight="bold">
        Service Account JSON
      </Text>
      {validationError && (
        <Callout.Root color="red" mb="2">
          <Callout.Icon>
            <ExclamationTriangleIcon />
          </Callout.Icon>
          <Callout.Text>{validationError}</Callout.Text>
        </Callout.Root>
      )}
      <TextArea
        name="credentials_json"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          const isValid = validateJson(e.target.value);
          e.target.setCustomValidity(isValid ? '' : 'Please enter valid JSON');
        }}
        placeholder="Paste your service account JSON here"
        required
        style={{ height: '200px' }}
        onPaste={handleCredentialsPaste}
      />
    </label>
  );
}
