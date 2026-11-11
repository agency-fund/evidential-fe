'use client';
import { Callout, Flex } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { ReactNode } from 'react';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { TechnicalDetails } from '@/components/ui/technical-details';
import { formatErrorReport, ReportField } from '@/services/error-report';

interface ErrorCalloutProps {
  title: ReactNode;
  /** The title as plain text, for the copy button. */
  titleText: string;
  /** The lines children show, as plain text, for the copy button. */
  bodyText: string[];
  /**
   * Returns the fields shown under Technical details, which is omitted when this is undefined. Called only on the
   * client, when the section opens or on copy, so it may read window.
   */
  details?: () => ReportField[];
  children: ReactNode;
}

export function ErrorCallout({ title, titleText, bodyText, details, children }: ErrorCalloutProps) {
  const copyText = () => formatErrorReport(titleText, bodyText, details?.() ?? []);

  return (
    // Callout.Root places its icon at grid line -2 and its content at -1, in columns that fit their content. One
    // explicit auto column holds the icon, and the content's implicit column fills the rest, so the copy button sits
    // at the callout's right edge. Callout has no prop for this.
    <Callout.Root color="red" role="alert" style={{ gridTemplateColumns: 'auto', gridAutoColumns: '1fr' }}>
      <Callout.Icon>
        <InfoCircledIcon />
      </Callout.Icon>
      <Flex direction="column" gap="2">
        <Flex justify="between" align="start" gap="3">
          <Callout.Text weight="bold">{title}</Callout.Text>
          <CopyToClipBoard content={copyText} tooltipContent="Copy error details" size="1" />
        </Flex>
        {children}
        {details === undefined ? null : <TechnicalDetails details={details} />}
      </Flex>
    </Callout.Root>
  );
}
