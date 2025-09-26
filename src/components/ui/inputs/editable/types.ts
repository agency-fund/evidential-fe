export type ButtonPlacement = 'bottom-left' | 'bottom-right' | 'inline-right' | 'inline-left';
export type InputSize = '1' | '2' | '3';

export interface LayoutConfig {
  direction: 'row' | 'column';
  justify: 'start' | 'center' | 'end';
  align: 'start' | 'center' | 'end' | 'stretch';
}

export interface BaseEditableProps<T = Record<string, any>> {
  value: string;
  fieldKey: keyof T;
  onUpdate: (formData: FormData) => Promise<void>;
  isUpdating?: boolean;
  buttonPlacement?: ButtonPlacement;
  inputSize?: InputSize;
}
