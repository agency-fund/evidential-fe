import { InspectDatasourceTableResponse } from '@/api/methods.schemas';
import { SelectField } from './select-field';

const CLUSTER_KEY_TOOLTIP =
  'If your treatment is naturally delivered at a group level (such as schools, clinics, ' +
  'or districts), but you will track metrics at the participant level, set this to ' +
  'randomly assign whole groups of participants together to your arms. ' +
  'Select the field that identifies each group.';

interface SelectClusterKeyProps {
  tableData: InspectDatasourceTableResponse | undefined;
  /** Input text owned by the parent component. */
  inputValue: string;
  isLoading: boolean;
  onChange: (inputText: string, selectedKey?: string) => void;
  disabled?: boolean;
  excludeFieldName?: string; // to prevent the cluster key from being the same as the primary key
}

export const SelectClusterKey = (props: SelectClusterKeyProps) => (
  <SelectField {...props} label="Cluster key (optional)" tooltip={CLUSTER_KEY_TOOLTIP} />
);
