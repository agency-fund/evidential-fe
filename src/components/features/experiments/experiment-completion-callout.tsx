import { Callout } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';

interface ExperimentCompletionCalloutProps {
  endDate: string;
  hasImpact: boolean;
  hasDecision: boolean;
}

const getTimingState = (endDate: string) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const [year, month, day] = endDate.split('T')[0].split('-').map(Number);
  const endDateTime = new Date(year, month - 1, day);

  const daysUntilEnd = Math.ceil((endDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isFinished = daysUntilEnd < 0;
  const isEndingToday = daysUntilEnd === 0;
  const isFinishingSoon = daysUntilEnd > 0 && daysUntilEnd <= 3;

  return { isFinished, isEndingToday, isFinishingSoon };
};

const getMessage = (isFinished: boolean, isEndingToday: boolean): string => {
  if (isFinished) {
    return 'Congratulations! This experiment has completed.';
  }

  if (isEndingToday) {
    return 'Congratulations! Your experiment concludes today.';
  }

  return 'Congratulations! Your experiment concludes soon.';
};

export function ExperimentCompletionCallout({ endDate, hasImpact, hasDecision }: ExperimentCompletionCalloutProps) {
  const { isFinished, isEndingToday, isFinishingSoon } = getTimingState(endDate);
  const shouldShow = !hasImpact && !hasDecision && (isFinished || isEndingToday || isFinishingSoon);

  if (!shouldShow) {
    return null;
  }

  const message = getMessage(isFinished, isEndingToday);

  return (
    <Callout.Root color="green">
      <Callout.Icon>
        <InfoCircledIcon />
      </Callout.Icon>
      <Callout.Text>
        {message} <a href="#decision-and-impact">Summarize the impact</a>.
      </Callout.Text>
    </Callout.Root>
  );
}
