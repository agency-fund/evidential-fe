import { ButtonPlacement, LayoutConfig } from './types';

export const BUTTON_LAYOUTS: Record<ButtonPlacement, LayoutConfig> = {
  'inline-right': {
    direction: 'row',
    justify: 'end',
    align: 'center',
  },
  'inline-left': {
    direction: 'row',
    justify: 'start',
    align: 'center',
  },
  'bottom-right': {
    direction: 'column',
    justify: 'end',
    align: 'stretch',
  },
  'bottom-left': {
    direction: 'column',
    justify: 'start',
    align: 'stretch',
  },
};
