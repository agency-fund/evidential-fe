'use client';
import { Flex, Text } from '@radix-ui/themes';
import { SampleCall, SampleCalls } from '@/api/methods.schemas';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { API_BASE_URL } from '@/services/constants';

/**
 * Joins the configured API base URL with a call's path, preserving template placeholders like
 * `{participant_id}` (which `new URL` would percent-encode). Falls back to the bare path when no
 * base URL is configured.
 */
function fullUrl(path: string): string {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL.replace(/\/+$/, '')}${path}`;
}

/** Builds a copy-pasteable curl command for a sample call. */
function buildCurl(call: SampleCall): string {
  const lines = [`curl -X ${call.method} '${fullUrl(call.path)}'`];
  for (const [name, value] of Object.entries(call.headers)) {
    lines.push(`  -H '${name}: ${value}'`);
  }
  if (call.body) {
    lines.push(`  -H 'Content-Type: application/json'`);
    // Trailing bash comment flagging the example outcome as a placeholder to edit. Safe because the
    // body is always the final line (no `\` continuation), so `#` comments out only the reminder.
    const outcome = call.body.outcome;
    const reminder =
      outcome !== undefined ? `  # Example value - replace ${JSON.stringify(outcome)} with the actual outcome` : '';
    lines.push(`  -d '${JSON.stringify(call.body)}'${reminder}`);
  }
  return lines.join(' \\\n');
}

/**
 * Whether an example response shows an assigned arm. The arm is server-chosen
 * (we always just pick the control arm as it is first in the list) and varies per
 * participant, so when one is present we caption the example to make that clear.
 */
function responseHasArm(exampleResponse: object): boolean {
  return JSON.stringify(exampleResponse).includes('"arm_id"');
}

function CodeBlock({ content }: { content: string }) {
  return (
    <pre
      style={{
        margin: 0,
        padding: 'var(--space-2)',
        background: 'var(--gray-a3)',
        borderRadius: 'var(--radius-2)',
        fontSize: 'var(--font-size-1)',
        overflowX: 'auto',
      }}
    >
      {content}
    </pre>
  );
}

function SampleCallItem({ call }: { call: SampleCall }) {
  const curl = buildCurl(call);
  return (
    <Flex direction="column" gap="2">
      <Flex align="center" justify="between">
        <Text size="2" weight="medium">
          {call.label}
        </Text>
        <CopyToClipBoard content={curl} tooltipContent="Copy as curl" />
      </Flex>
      <CodeBlock content={curl} />
      {call.example_response ? (
        <Flex direction="column" gap="1">
          <Text size="1" color="gray">
            Expected response
          </Text>
          <CodeBlock content={JSON.stringify(call.example_response, null, 2)} />
          {responseHasArm(call.example_response) ? (
            <Text size="1" color="gray">
              Example shows your control arm; the actual assigned arm varies per participant.
            </Text>
          ) : null}
        </Flex>
      ) : null}
    </Flex>
  );
}

/** Renders the backend-provided example API calls for an experiment as curl commands + responses. */
export function SampleCallsList({ sampleCalls }: { sampleCalls: SampleCalls }) {
  return (
    <Flex direction="column" gap="4">
      {sampleCalls.calls.map((call) => (
        <SampleCallItem key={call.label} call={call} />
      ))}
    </Flex>
  );
}
