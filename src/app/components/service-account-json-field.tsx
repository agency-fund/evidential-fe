'use client';
import { Text, TextArea } from '@radix-ui/themes';

interface ServiceAccountJsonFieldProps {
  value: string;
  onChange: (value: string) => void;
  onProjectIdFound?: (projectId: string) => void;
}

export function ServiceAccountJsonField({ value, onChange, onProjectIdFound }: ServiceAccountJsonFieldProps) {
  const validateJson = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
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
