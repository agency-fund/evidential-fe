import { Impact } from '@/api/methods.schemas';

type ImpactColor = 'red' | 'yellow' | 'green' | 'blue' | 'gray';

interface ImpactConfig {
  value: Impact;
  label: string;
  shortLabel: string;
  description: string;
  color: ImpactColor;
}

// Ordered list of Impacts and associated strings.
export const IMPACT_LIST = [
  {
    value: 'unclear',
    label: 'Unclear Impact',
    shortLabel: 'Unclear',
    description: 'Not enough data to determine impact',
    color: 'gray',
  },
  {
    value: 'negative',
    label: 'Negative Impact',
    shortLabel: 'Negative',
    description: 'Significant adverse effects observed',
    color: 'red',
  },
  {
    value: 'low',
    label: 'Low Impact',
    shortLabel: 'Low',
    description: 'Minor positive effects observed',
    color: 'yellow',
  },
  {
    value: 'medium',
    label: 'Medium Impact',
    shortLabel: 'Medium',
    description: 'Moderate positive effects observed',
    color: 'blue',
  },
  {
    value: 'high',
    label: 'High Impact',
    shortLabel: 'High',
    description: 'Significant positive effects observed',
    color: 'green',
  },
] as const satisfies readonly ImpactConfig[];

export const IMPACT_CONFIG: Record<Impact, ImpactConfig> = Object.fromEntries(
  IMPACT_LIST.map((config) => [config.value, config]),
) as Record<Impact, ImpactConfig>;
