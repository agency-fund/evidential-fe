'use client';

import { Button } from '@radix-ui/themes';
import { ExternalLinkIcon } from '@radix-ui/react-icons';

/** Opens a committed Google Sheets experiment's outcomes tab, where users enter outcomes. */
export function GoogleSheetsExperimentTab({ experimentSpreadsheetUrl }: { experimentSpreadsheetUrl: string }) {
  return (
    <Button variant="soft" asChild>
      <a href={experimentSpreadsheetUrl} target="_blank" rel="noopener noreferrer">
        <ExternalLinkIcon /> Open experiment tab
      </a>
    </Button>
  );
}
