import { DataType, InspectDatasourceTableResponse } from '@/api/methods.schemas';
import { isEligibleForUseAsMetric } from '@/services/genapi-helpers';
import { SelectField } from './select-field';

const TARGET_TOOLTIP =
  "The data-warehouse column for this bandit's outcome. Its type sets what a valid outcome looks " +
  'like — a boolean column expects 0/1, a numeric column expects a number. Validity is enforced ' +
  'when the results are sent to Evidential.';

// Only boolean/numeric columns can back a bandit outcome (the chosen type locks binary vs real-valued
// downstream), so don't offer columns we'd reject at create time.
const isMetricEligible = (field: { data_type: DataType }) => isEligibleForUseAsMetric(field.data_type);

interface SelectTargetFieldProps {
  tableData: InspectDatasourceTableResponse | undefined;
  /** Input text owned by the parent component. */
  inputValue: string;
  isLoading: boolean;
  onChange: (inputText: string, selectedKey?: string) => void;
  disabled?: boolean;
  excludeFieldName?: string; // to prevent the target from being the same as the primary key
}

export const SelectTargetField = (props: SelectTargetFieldProps) => (
  <SelectField {...props} label="Target column" tooltip={TARGET_TOOLTIP} isEligible={isMetricEligible} />
);
