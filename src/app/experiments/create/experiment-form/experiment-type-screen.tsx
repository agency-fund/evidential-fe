import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData, ExperimentType } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { Badge, Flex, RadioCards, Text } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';
import {
  CMABExperimentSpecInputExperimentType,
  MABExperimentSpecInputExperimentType,
  OnlineFrequentistExperimentSpecInputExperimentType,
  PreassignedFrequentistExperimentSpecInputExperimentType,
} from '@/api/methods.schemas';

type ExperimentTypeMessage = { type: 'set-experiment-type'; value: ExperimentType };

const experimentTypeOptions = [
  {
    value: PreassignedFrequentistExperimentSpecInputExperimentType.freq_preassigned,
    title: 'Preassigned A/B Testing',
    badge: 'A/B',
    description:
      'Participants are assigned to experiment arms at design time. Suitable for controlled experiments with fixed sample sizes.',
  },
  {
    value: OnlineFrequentistExperimentSpecInputExperimentType.freq_online,
    title: 'Online A/B Testing',
    badge: 'A/B',
    description:
      'Participants are assigned to experiment arms dynamically as they arrive. Better for real-time experiments with unknown traffic.',
  },
  {
    value: MABExperimentSpecInputExperimentType.mab_online,
    title: 'Multi-Armed Bandit',
    badge: 'MAB',
    description:
      'Adaptive allocation that learns and optimizes automatically. Minimizes opportunity cost by converging to the best performing variant.',
  },
  {
    value: CMABExperimentSpecInputExperimentType.cmab_online,
    title: 'Contextual Multi-Armed Bandit',
    badge: 'CMAB',
    description:
      'Context-aware optimization for personalized experiences. Adapts recommendations based on user or environmental context.',
  },
];

export const ExperimentTypeScreen = ({ data, dispatch }: ScreenProps<ExperimentFormData, ExperimentTypeMessage>) => (
  <Flex direction="column" gap={'3'}>
    <WizardBreadcrumbs />
    <Text as="label" size="2" weight="bold" mb="6px">
      What type of experiment do you want to create?
    </Text>
    <RadioCards.Root
      defaultValue={data.experimentType}
      onValueChange={(v: ExperimentType) => dispatch({ type: 'set-experiment-type', value: v })}
      columns="2"
    >
      {experimentTypeOptions.map((option) => (
        <RadioCards.Item key={option.value} value={option.value}>
          <Flex direction="column" gap="1">
            <Flex align="center" gap="2">
              <Text weight="bold">{option.title}</Text>
              <Badge>{option.badge}</Badge>
            </Flex>
            <Text size="2" color="gray">
              {option.description}
            </Text>
          </Flex>
        </RadioCards.Item>
      ))}
    </RadioCards.Root>
  </Flex>
);
