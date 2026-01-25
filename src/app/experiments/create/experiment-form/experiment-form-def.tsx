// Form data types
import { packScreen, WizardForm } from '@/services/wizard/wizard-types';
import { ExperimentMetadataScreen } from '@/app/experiments/create/experiment-form/experiment-metadata-screen';
import { ExperimentTypeScreen } from '@/app/experiments/create/experiment-form/experiment-type-screen';
import {
  Arm,
  BayesABExperimentSpecInputExperimentType,
  DesignSpecInput,
  FilterInput,
  GetFiltersResponseElement,
  PowerResponseOutput,
} from '@/api/methods.schemas';
import { ExperimentSelectDatasourceScreen } from '@/app/experiments/create/experiment-form/experiment-select-datasource-screen';
import { ExperimentSelectBinaryOrRealOutcomes } from '@/app/experiments/create/experiment-form/experiment-select-binary-or-real-outcomes';
import { ExperimentDescribeContextsScreen } from '@/app/experiments/create/experiment-form/experiment-describe-contexts-screen';
import {
  ExperimentDescribeArmsMessage,
  ExperimentDescribeArmsScreen,
} from '@/app/experiments/create/experiment-form/experiment-describe-arms-screen';
import {
  ExperimentFreqStackScreen,
  ExperimentFreqStackScreenMessage,
} from '@/app/experiments/create/experiment-form/experiment-freq-stack-screen';
import { ExperimentDescribeWebhooksScreen } from '@/app/experiments/create/experiment-form/experiment-describe-webhooks-screen';
import { ExperimentsSummarizeBayesScreen } from '@/app/experiments/create/experiment-form/experiment-summarize-bayes-screen';
import { ExperimentsSummarizeFreqScreen } from '@/app/experiments/create/experiment-form/experiment-summarize-freq-screen';
import { BanditArm, Context, MetricWithMDE, Stratum } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { ExperimentDescribeBanditArmsScreen } from '@/app/experiments/create/experiment-form/experiment-describe-bandit-arms-screen';
import {
  getReasonableEndDate,
  getReasonableStartDate,
} from '@/app/experiments/create/experiment-form/experiment-form-helpers';

export type ExperimentType = Exclude<DesignSpecInput['experiment_type'], BayesABExperimentSpecInputExperimentType>;

// Defines the entirety of the editable data collected via this wizard flow.
export type ExperimentFormData = {
  // experiment-metadata-screen
  name?: string;
  hypothesis?: string;
  designUrl?: string;
  startDate?: string;
  endDate?: string;

  // experiment-type-screen
  experimentType?: ExperimentType;

  // experiment-select-datasource-screen
  datasourceId?: string;
  tableName?: string;

  // experiment-freq-stack-screen
  primaryKey?: string;
  primaryMetric?: MetricWithMDE;
  secondaryMetrics?: MetricWithMDE[];
  filters?: FilterInput[];
  // Cache of available filter fields (and their data types) for lookup/display/search
  availableFilterFields?: GetFiltersResponseElement[];
  strata?: Stratum[];
  // These next 2 Experiment Parameters are strings to allow for empty values,
  // which should be converted to numbers when making power or experiment creation requests.
  confidence?: string;
  power?: string;
  // Populated when user clicks "Power Check" on DesignForm
  chosenN?: number;
  powerCheckResponse?: PowerResponseOutput;

  // experiment-describe-webhooks-screen
  selectedWebhookIds?: string[];

  // experiment-select-binary-or-real-outcomes
  outcomeType?: 'binary' | 'real';

  // experiment-describe-arms-screen
  arms?: Omit<Arm, 'arm_id'>[];

  // experiment-describe-bandit-arms-screen
  bandit_arms?: BanditArm[];

  // experiment-describe-contexts-screen
  priorType?: 'normal';
  contexts?: Context[];
};

const isFreq = (experimentType: ExperimentType) => {
  return experimentType === 'freq_online' || experimentType === 'freq_preassigned';
};

const isCmab = (experimentType: ExperimentType) => {
  return experimentType === 'cmab_online';
};

// Defines a type for all known screen IDs for the experiment form. This type is used with screen() to
// type-check the ids returned by nextScreen and prevScreen.
export type ExperimentScreenId =
  | 'metadata'
  | 'experiment-type'
  | 'freq-select-datasource'
  | 'bayes-binary-or-real'
  | 'describe-contexts'
  | 'describe-arms'
  | 'describe-bandit-arms'
  | 'describe-webhooks'
  | 'freq-stack'
  | 'summarize-freq'
  | 'summarize-bayes';

// Helper to create screens with proper type inference
const screen = packScreen<ExperimentFormData, ExperimentScreenId>();

const FREQUENTIST_BREADCRUMBS: Array<ExperimentScreenId> = [
  'metadata',
  'experiment-type',
  'freq-select-datasource',
  'describe-arms',
  'freq-stack',
  'describe-webhooks',
  'summarize-freq',
] as const;

const CMAB_BREADCRUMBS: Array<ExperimentScreenId> = [
  'metadata',
  'experiment-type',
  'bayes-binary-or-real',
  'describe-contexts',
  'describe-bandit-arms',
  'describe-webhooks',
  'summarize-bayes',
] as const;

const MAB_BREADCRUMBS: Array<ExperimentScreenId> = [
  'metadata',
  'experiment-type',
  'bayes-binary-or-real',
  'describe-bandit-arms',
  'describe-webhooks',
  'summarize-bayes',
] as const;

const breadcrumbs = ({ experimentType }: { experimentType?: ExperimentType }) => {
  if (experimentType === undefined) {
    return [];
  } else if (isFreq(experimentType)) {
    return FREQUENTIST_BREADCRUMBS;
  } else if (isCmab(experimentType)) {
    return CMAB_BREADCRUMBS;
  } else {
    return MAB_BREADCRUMBS;
  }
};

export const ExperimentForm: WizardForm<ExperimentFormData, ExperimentScreenId, undefined> = {
  initialData: () => ({
    name: 'New Hypothesis',
    experimentType: 'freq_online',
    startDate: getReasonableStartDate(),
    endDate: getReasonableEndDate(),
    arms: [
      { arm_name: 'Control', arm_description: 'Control' },
      { arm_name: 'Treatment', arm_description: 'Treatment' },
    ],
    confidence: '95',
    power: '80',
  }),
  initialScreenId: () => 'metadata',
  breadcrumbs: breadcrumbs,
  screens: {
    metadata: screen({
      breadcrumbTitle: 'Experiment Description',
      render: ExperimentMetadataScreen,
      reducer: (data, msg) => {
        if (msg.type === 'set-name') return { ...data, name: msg.value };
        if (msg.type === 'set-hypothesis') return { ...data, hypothesis: msg.value };
        if (msg.type === 'set-design-url') return { ...data, designUrl: msg.value || undefined };
        if (msg.type === 'set-start-date') return { ...data, startDate: msg.value };
        if (msg.type === 'set-end-date') return { ...data, endDate: msg.value };
        return data;
      },
      isNextEnabled: (data) => {
        if (!data.name) return false;
        if (!data.startDate || !data.endDate) return false;
        if (data.endDate <= data.startDate) return false;
        return true;
      },
      isPrevEnabled: () => false,
      prevScreen: () => null,
      nextScreen: () => ({ type: 'screen', id: 'experiment-type' }),
      breadcrumbs: () => ['metadata', 'experiment-type', null],
      isBreadcrumbClickable: () => true,
    }),
    'experiment-type': screen({
      breadcrumbTitle: 'Type',
      render: ExperimentTypeScreen,
      reducer: (data, msg) => {
        if (msg.type === 'set-experiment-type') {
          return { ...data, experimentType: msg.value };
        }
        return data;
      },
      isNextEnabled: (data) => !!data.experimentType,
      isPrevEnabled: () => true,
      prevScreen: () => ({ type: 'screen', id: 'metadata' }),
      nextScreen: ({ experimentType }) => {
        switch (experimentType) {
          case 'freq_online':
          case 'freq_preassigned':
            return { type: 'screen', id: 'freq-select-datasource' };
          case 'mab_online':
          case 'cmab_online':
            return { type: 'screen', id: 'bayes-binary-or-real' };
          default:
            throw new Error(`Experiment type ${experimentType} unhandled`);
        }
      },
      breadcrumbs: () => ['metadata', 'experiment-type', null],
      isBreadcrumbClickable: () => true,
    }),
    'freq-select-datasource': screen({
      breadcrumbTitle: 'Datasource',
      render: ExperimentSelectDatasourceScreen,
      reducer: (data, msg) => {
        if (msg.type === 'set-datasource') {
          return {
            ...data,
            datasourceId: msg.datasourceId,
            tableName: msg.tableName,
          };
        }
        return data;
      },
      isNextEnabled: (data) => !!data.datasourceId && !!data.tableName,
      isPrevEnabled: () => true,
      prevScreen: () => ({ type: 'screen', id: 'experiment-type' }),
      nextScreen: () => ({ type: 'screen', id: 'describe-arms' }),
      isBreadcrumbClickable: () => true,
      hideNavigation: () => true,
    }),
    'bayes-binary-or-real': screen({
      breadcrumbTitle: 'Outcomes',
      render: ExperimentSelectBinaryOrRealOutcomes,
      reducer: (data, msg) => {
        if (msg.type === 'set-outcome-type') {
          return { ...data, outcomeType: msg.value };
        }
        return data;
      },
      isNextEnabled: () => true,
      isPrevEnabled: () => true,
      prevScreen: () => ({ type: 'screen', id: 'experiment-type' }),
      nextScreen: ({ experimentType }) => {
        if (experimentType === 'cmab_online') {
          return { type: 'screen', id: 'describe-contexts' };
        }
        return { type: 'screen', id: 'describe-arms' };
      },
      breadcrumbs: () => ['metadata', 'experiment-type', 'bayes-binary-or-real'],
      isBreadcrumbClickable: () => true,
    }),
    'describe-contexts': screen({
      breadcrumbTitle: 'Contexts',
      render: ExperimentDescribeContextsScreen,
      reducer: (data) => data,
      isNextEnabled: () => true,
      isPrevEnabled: () => true,
      prevScreen: () => ({ type: 'screen', id: 'bayes-binary-or-real' }),
      nextScreen: () => ({ type: 'screen', id: 'describe-bandit-arms' }),
      isBreadcrumbClickable: ({ outcomeType }) => !!outcomeType,
    }),
    'describe-bandit-arms': screen({
      breadcrumbTitle: 'Arms',
      render: ExperimentDescribeBanditArmsScreen,
      reducer: (data) => data,
      isNextEnabled: () => true,
      isPrevEnabled: () => true,
      prevScreen: ({ experimentType }) => {
        switch (experimentType) {
          case 'mab_online':
            return { type: 'screen', id: 'bayes-binary-or-real' };
          case 'cmab_online':
            return { type: 'screen', id: 'describe-contexts' };
          default:
            throw new Error(`Experiment type ${experimentType} unhandled`);
        }
      },
      nextScreen: ({ experimentType }) => {
        switch (experimentType) {
          case 'mab_online':
          case 'cmab_online':
            return { type: 'screen', id: 'describe-webhooks' };
          default:
            throw new Error(`Experiment type ${experimentType} unhandled`);
        }
      },
    }),
    'describe-arms': screen({
      breadcrumbTitle: 'Arms',
      render: ExperimentDescribeArmsScreen,
      reducer: (data, msg: ExperimentDescribeArmsMessage) => {
        const arms = data.arms ?? [];

        if (msg.type === 'add-arm') {
          const newArm =
            arms.length === 0
              ? { arm_name: 'Control', arm_description: 'Arm 1 will be used as baseline for comparison.' }
              : { arm_name: '', arm_description: '' };
          // Reset weights when adding
          const newArms = [...arms, newArm].map((a) => ({ ...a, arm_weight: undefined }));
          return { ...data, arms: newArms };
        }

        if (msg.type === 'remove-arm') {
          // Reset weights when removing
          const newArms = arms.filter((_, i) => i !== msg.index).map((a) => ({ ...a, arm_weight: undefined }));
          return { ...data, arms: newArms };
        }

        if (msg.type === 'update-arm') {
          const newArms = [...arms];
          newArms[msg.index] = { ...newArms[msg.index], [msg.field]: msg.value };
          return { ...data, arms: newArms };
        }

        if (msg.type === 'set-weights') {
          const newArms = arms.map((arm, i) => ({ ...arm, arm_weight: msg.weights[i] }));
          return { ...data, arms: newArms };
        }

        return data;
      },
      isNextEnabled: (data) => (data.arms?.length ?? 0) >= 2,
      isPrevEnabled: () => true,
      prevScreen: ({ experimentType }) => {
        switch (experimentType) {
          case 'freq_online':
          case 'freq_preassigned':
            return { type: 'screen', id: 'freq-select-datasource' };
          default:
            throw new Error(`Experiment type ${experimentType} unhandled`);
        }
      },
      nextScreen: ({ experimentType }) => {
        switch (experimentType) {
          case 'mab_online':
          case 'cmab_online':
            return { type: 'screen', id: 'describe-webhooks' };
          case 'freq_online':
          case 'freq_preassigned':
            return { type: 'screen', id: 'freq-stack' };
          default:
            throw new Error(`Experiment type ${experimentType} unhandled`);
        }
      },
      isBreadcrumbClickable: () => true,
    }),
    'describe-webhooks': screen({
      breadcrumbTitle: 'Webhooks',
      render: ExperimentDescribeWebhooksScreen,
      reducer: (data) => data,
      isNextEnabled: () => true,
      isPrevEnabled: () => true,
      prevScreen: ({ experimentType }) => {
        switch (experimentType) {
          case 'mab_online':
          case 'cmab_online':
            return { type: 'screen', id: 'describe-bandit-arms' };
          case 'freq_online':
          case 'freq_preassigned':
            return { type: 'screen', id: 'freq-stack' };
          default:
            throw new Error(`Experiment type ${experimentType} unhandled`);
        }
      },
      nextScreen: ({ experimentType }) => {
        switch (experimentType) {
          case 'mab_online':
          case 'cmab_online':
            return { type: 'screen', id: 'summarize-bayes' };
          case 'freq_online':
          case 'freq_preassigned':
            return { type: 'screen', id: 'summarize-freq' };
          default:
            throw new Error(`Experiment type ${experimentType} unhandled`);
        }
      },
    }),
    'freq-stack': screen({
      breadcrumbTitle: 'Parameters',
      render: ExperimentFreqStackScreen,
      reducer: (data, msg: ExperimentFreqStackScreenMessage) => {
        // Primary key
        if (msg.type === 'set-primary-key') {
          return { ...data, primaryKey: msg.value };
        }

        // Metric builder actions - all metric changes invalidate power check
        if (msg.type === 'primary-metric-select') {
          return { ...data, primaryMetric: msg.primaryMetric, powerCheckResponse: undefined, chosenN: undefined };
        }
        if (msg.type === 'primary-metric-deselect') {
          return {
            ...data,
            primaryMetric: msg.primaryMetric,
            secondaryMetrics: msg.secondaryMetrics,
            powerCheckResponse: undefined,
            chosenN: undefined,
          };
        }
        if (msg.type === 'promote-secondary-to-primary') {
          return {
            ...data,
            primaryMetric: msg.primaryMetric,
            secondaryMetrics: msg.secondaryMetrics,
            powerCheckResponse: undefined,
            chosenN: undefined,
          };
        }
        if (msg.type === 'secondary-metric-add') {
          return { ...data, secondaryMetrics: msg.secondaryMetrics, powerCheckResponse: undefined, chosenN: undefined };
        }
        if (msg.type === 'secondary-metric-remove') {
          return { ...data, secondaryMetrics: msg.secondaryMetrics, powerCheckResponse: undefined, chosenN: undefined };
        }
        if (msg.type === 'mde-change') {
          return {
            ...data,
            primaryMetric: msg.primaryMetric ?? data.primaryMetric,
            secondaryMetrics: msg.secondaryMetrics ?? data.secondaryMetrics,
            powerCheckResponse: undefined,
            chosenN: undefined,
          };
        }

        // Filter builder - filter changes invalidate power check
        if (msg.type === 'set-filters') {
          return { ...data, filters: msg.filters, powerCheckResponse: undefined, chosenN: undefined };
        }

        // Strata builder
        if (msg.type === 'set-strata') {
          return { ...data, strata: msg.strata.map((fieldName) => ({ fieldName })) };
        }

        // Power check - changing confidence/power invalidates power check response
        if (msg.type === 'set-confidence') {
          return { ...data, confidence: msg.value, powerCheckResponse: undefined, chosenN: undefined };
        }
        if (msg.type === 'set-power') {
          return { ...data, power: msg.value, powerCheckResponse: undefined, chosenN: undefined };
        }
        if (msg.type === 'set-power-check-response') {
          return { ...data, powerCheckResponse: msg.response, chosenN: msg.chosenN };
        }
        if (msg.type === 'set-chosen-n') {
          return { ...data, chosenN: msg.value };
        }

        return data;
      },
      isNextEnabled: (data) => {
        // Must have primary key selected
        if (!data.primaryKey) return false;
        // Must have primary metric selected
        if (!data.primaryMetric) return false;
        // Must have valid confidence value (50-99)
        const confidence = Number(data.confidence);
        if (isNaN(confidence) || confidence < 50 || confidence > 99) return false;
        // Must have valid power value (50-99)
        const power = Number(data.power);
        if (isNaN(power) || power < 50 || power > 99) return false;
        // Must have run power check
        if (!data.powerCheckResponse) return false;
        // Must have selected a sample size
        if (data.chosenN === undefined) return false;
        return true;
      },
      isPrevEnabled: () => true,
      prevScreen: () => ({ type: 'screen', id: 'describe-arms' }),
      nextScreen: () => ({ type: 'screen', id: 'describe-webhooks' }),
    }),
    'summarize-freq': screen({
      breadcrumbTitle: 'Summary',
      render: ExperimentsSummarizeFreqScreen,
      reducer: (data) => data,
      isNextEnabled: () => true,
      isPrevEnabled: () => true,
      prevScreen: () => ({ type: 'screen', id: 'describe-webhooks' }),
      nextScreen: () => ({ type: 'submit' }),
    }),
    'summarize-bayes': screen({
      breadcrumbTitle: 'Summary',
      render: ExperimentsSummarizeBayesScreen,
      reducer: (data) => data,
      isNextEnabled: () => true,
      isPrevEnabled: () => true,
      prevScreen: () => ({ type: 'screen', id: 'describe-webhooks' }),
      nextScreen: () => ({ type: 'submit' }),
    }),
  },
};
