import { JSX } from 'react';

export type BreadcrumbInfo =
  | {
      type: 'screen';
      screenId: string;
      clickable: boolean;
    }
  | { type: 'unknown' };

// Props passed to screen render functions
type ScreenProps<FormData, Message> = {
  // FormData is the global state. Screens should treat this as read-only and dispatch events for the Screen.reducer to
  // handle.
  data: FormData;

  // dispatch() is how screens send events to the form state reducer. This is the only way to modify the global form
  // state.
  dispatch: (message: Message) => void;

  // The ID of the current screen.
  currentScreenId: string;

  // The breadcrumbs to render.
  breadcrumbs: Array<BreadcrumbInfo>;
};

// Screen definition with typed messages. The ScreenId generic enables type-safe navigation:
// prevScreen and nextScreen can only return IDs that exist in the form's screens object.
type Screen<FormData, Message, ScreenId extends string> = {
  // React component that renders this screen.
  render: (props: ScreenProps<FormData, Message>) => JSX.Element;
  // Receives events from the Screen and can apply changes to FormData.
  reducer: (data: FormData, message: Message) => FormData;
  // When isNextEnabled returns true, the "Next" button will be enabled. If it returns anything else, the button will
  // be disabled.
  isNextEnabled: (data: FormData) => boolean;
  // When isPrev enabled returns true, the "Prev" button will be enabled. If it returns anything else, the button will
  // be disabled.
  isPrevEnabled: (data: FormData) => boolean;
  // Describes the behavior of the "prev" button: return null to hide prev button, and one of the navigation types
  // to navigate to a screen by id.
  prevScreen: (data: FormData) => null | { type: 'screen'; id: ScreenId };
  // Describes the behavior of the "next" button: return a "screen" type to navigate to a specific screen by id, or
  // a "submit" type to cause the Wizard's onSubmit handler to be triggered.
  nextScreen: (data: FormData) => { type: 'screen'; id: ScreenId } | { type: 'submit' };
  // Breadcrumbs to render
  breadcrumbs?: (data: FormData) => Array<ScreenId | null>;
  // Whether or not the breadcrumb is navigable.
  isBreadcrumbClickable?: (data: FormData) => boolean;
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
type WizardForm<FormData, ScreenId extends string> = {
  // The initial value of the form. When creating new entities, this is likely suitable default values that the user
  // may refine. For existing entities, this is likely the persisted values to be edited.
  initialData: () => FormData;

  // The screens, keyed by their ID. TypeScript ensures this object has exactly the keys defined in ScreenId.
  screens: { [K in ScreenId]: PackedScreen<FormData, ScreenId> };

  // Default breadcrumbs. If an individual screen doesn't specify a breadcrumb function, this is used instead.
  breadcrumbs?: (data: FormData) => Array<ScreenId>;

  // Returns the screen ID to start on, based on provided data. This allows the form definition to select a starting
  // screen based on the initial form data. For example, a user who saves a draft experiment will want to be returned
  // to the same page they left on when returning to finish the draft.
  initialScreenId: (data: FormData) => ScreenId;
};

export default function Definer() {}

export type { ScreenProps, Screen, ScreenConsumer, PackedScreen, WizardForm };
export { packScreen };
