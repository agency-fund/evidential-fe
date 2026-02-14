import { JSX } from 'react';

export type BreadcrumbInfo =
  | {
      type: 'screen';
      screenId: string;
      label: string;
      clickable: boolean;
    }
  | { type: 'unknown' };

// Props passed to screen render functions
type ScreenProps<FormData, Message, ScreenId extends string> = {
  // FormData is the global state. Screens should treat this as read-only and dispatch events for the Screen.reducer to
  // handle.
  data: FormData;

  // dispatch() is how screens send events to the form state reducer. This is the only way to modify the global form
  // state.
  dispatch: (message: Message) => void;

  // Navigate to the next screen (or trigger submit if on final screen)
  navigateNext: () => void;

  // Navigate to the previous screen (no-op if no previous screen)
  navigatePrev: () => void;

  // Navigate directly to a specific screen.
  navigateTo: (screenId: ScreenId) => void;
};

// Screen definition with typed messages. The ScreenId generic enables type-safe navigation:
// prevScreen and nextScreen can only return IDs that exist in the form's screens object.
type Screen<FormData, Message, ScreenId extends string> = {
  // Human-readable label for this screen, used by breadcrumbs.
  breadcrumbTitle?: string;
  // React component that renders this screen.
  render: (props: ScreenProps<FormData, Message, ScreenId>) => JSX.Element;
  // Receives events from the Screen and can apply changes to FormData.
  reducer: (data: FormData, message: Message) => FormData;
  // When isNextEnabled returns true, the "Next" button will be enabled. If it returns anything else, the button will
  // be disabled. If undefined, the next button will be enabled.
  isNextEnabled?: (data: FormData) => boolean;
  // When isPrev enabled returns true, the "Prev" button will be enabled. If it returns anything else, the button will
  // be disabled. If undefined, the prev button will be enabled.
  isPrevEnabled?: (data: FormData) => boolean;
  // Optional override for "prev" navigation. If omitted, Wizard falls back to breadcrumb order.
  // Return null to hide prev button. Return a "screen" type to navigate to a specific screen by id.
  prevScreen?: (data: FormData) => null | { type: 'screen'; id: ScreenId } | { type: 'wizard-exit-left' };
  // Optional override for "next" navigation. If omitted, Wizard falls back to breadcrumb order.
  // Return a "screen" type to navigate to a specific screen by id, or a "submit" type to trigger onSubmit.
  nextScreen?: (data: FormData) => { type: 'screen'; id: ScreenId } | { type: 'submit' };
  // Breadcrumbs to apply to the wizard flow. This controls the items in the breadcrumbs bar and the default behavior
  // of the next/prev buttons.
  breadcrumbs?: (data: FormData) => Array<ScreenId>;
  // Whether or not the breadcrumb for the current screen is navigable. If undefined, breadcrumb is clickable.
  isBreadcrumbClickable?: (data: FormData) => boolean;
  // Custom label for the "Next" button. If not set, defaults to "Next" or "Submit", depending on resolved next action.
  nextButtonLabel?: (data: FormData) => string;
  // Custom label for the "Back" button. If not set, defaults to "Back".
  prevButtonLabel?: (data: FormData) => string;
  // When true, the Wizard will not render NavigationButtons for this screen.
  hideNavigation?: (data: FormData) => boolean;
  // Optional tooltip message for the Next button (e.g., validation errors).
  nextButtonTooltip?: (data: FormData) => string | undefined;
};

// CPS-encoded existential - hides Message type while preserving type safety
type ScreenConsumer<FormData, ScreenId extends string, Result> = <Message>(
  screen: Screen<FormData, Message, ScreenId>,
) => Result;

type PackedScreen<FormData, ScreenId extends string> = {
  withScreen: <Result>(consumer: ScreenConsumer<FormData, ScreenId, Result>) => Result;
};

// Factory function to pack a screen (curried to bind FormData and ScreenId first)
function packScreen<FormData, ScreenId extends string>() {
  return <Message,>(screen: Screen<FormData, Message, ScreenId>): PackedScreen<FormData, ScreenId> => ({
    withScreen: (consumer) => consumer(screen),
  });
}

// Multi-step form definition. The form is described by some initial conditions, screens keyed by their ID,
// that can be navigated between using user-defined functions.
//
// The intention of this type and its related types is to allow all navigation-related and global-state related methods
// to be defined in one place. The screens themselves may observe but should not mutate the global state directly.
// All events from a screen should be handled by the per-screen reducer method Screen.reducer.
type WizardForm<FormData, ScreenId extends string, InputData> = {
  // The initial value of the form. When creating new entities, this is likely suitable default values that the user
  // may refine. For existing entities, this is likely the persisted values to be edited. This may be called more than
  // once so the return value must be deterministic.
  initialData: (extra?: InputData) => FormData;

  // The screens, keyed by their ID. TypeScript ensures this object has exactly the keys defined in ScreenId.
  screens: { [K in ScreenId]: PackedScreen<FormData, ScreenId> };

  // Default breadcrumbs. If an individual screen doesn't specify a breadcrumb function, this is used instead.
  // When screens omit prevScreen and nextScreen helpers, the breadcrumbs also define how next/prev buttons behave.
  breadcrumbs?: (data: FormData) => Array<ScreenId>;

  // Returns the screen ID to start on, based on provided data. This allows the form definition to select a starting
  // screen based on the initial form data. For example, a user who saves a draft experiment will want to be returned
  // to the same page they left on when returning to finish the draft.
  initialScreenId: (data: FormData) => ScreenId;
};

export default function Definer() {}

export type { ScreenProps, Screen, ScreenConsumer, PackedScreen, WizardForm };
export { packScreen };
