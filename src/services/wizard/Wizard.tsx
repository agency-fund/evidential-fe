'use client';
import { Fragment, useState } from 'react';
import { BreadcrumbInfo, WizardForm } from './wizard-types';
import { DebugDrawer } from './wizard-debug-drawer';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { WizardBreadcrumbsProvider } from './wizard-breadcrumbs-context';
import { Box } from '@radix-ui/themes';

type WizardProps<FormData, ScreenId extends string, InputData> = {
  // The wizard definition, composed of screens and breadcrumbs and callback functions that inform Wizard's behavior.
  form: WizardForm<FormData, ScreenId, InputData>;
  // Data to be injected into the initial state of the form.
  inputData?: InputData;
  // Screens can request that the "Prev" button invoke this handler. Useful for nested wizards.
  onPrev?: (data: FormData) => void;
  // Screens can request that the "Next" button invoke this handler. This is usually used by the final screen in
  // the series.
  onSubmit?: (data: FormData) => void;
  // If true, a debugging drawer will be rendered at the bottom of the screen, showing navigation state and current
  // form data.
  debug?: boolean;
};

export function Wizard<FormData, ScreenId extends string, InputData>({
  form,
  onSubmit,
  onPrev,
  debug,
  inputData,
}: WizardProps<FormData, ScreenId, InputData>) {
  const [data, setData] = useState<FormData>(() => form.initialData(inputData));
  const [currentScreenId, setCurrentScreenId] = useState<ScreenId>(() => form.initialScreenId(data));

  // Get current packed screen by id (direct object access instead of array.find)
  const currentPackedScreen = form.screens[currentScreenId];

  // Use CPS pattern to render the screen with full type safety
  return currentPackedScreen.withScreen((screen) => {
    const handleDispatch = (message: Parameters<typeof screen.reducer>[1]) => {
      console.log('handleDispatch', message);
      setData((prev) => screen.reducer(prev, message));
    };

    const handleNext = () => {
      const task = screen.nextScreen(data);
      switch (task.type) {
        case 'submit':
          if (onSubmit) {
            onSubmit(data);
          }
          break;
        case 'screen':
          setCurrentScreenId(task.id);
      }
    };

    const handlePrev = () => {
      const task = screen.prevScreen(data);
      if (!task) {
        return;
      }
      switch (task.type) {
        case 'screen':
          setCurrentScreenId(task.id);
          break;
        case 'wizard-exit-left':
          if (onPrev) {
            onPrev(data);
          }
          break;
      }
    };

    const handleNavigate = (screenId: string) => {
      setCurrentScreenId(screenId as ScreenId);
    };

    const prevScreen = screen.prevScreen(data);
    const isNextEnabled = screen.isNextEnabled(data);
    const nextScreen = screen.nextScreen(data);

    // Determine button labels
    const nextLabel = screen.nextButtonLabel
      ? screen.nextButtonLabel(data)
      : nextScreen.type === 'submit'
        ? 'Submit'
        : 'Next';
    const prevLabel = screen.prevButtonLabel ? screen.prevButtonLabel(data) : 'Back';

    // Check if navigation should be hidden
    const hideNav = screen.hideNavigation?.(data) ?? false;

    // Get tooltip message for next button
    const nextButtonTooltip = screen.nextButtonTooltip?.(data) ?? '';

    const screenIdBreadcrumbs = screen.breadcrumbs
      ? screen.breadcrumbs(data)
      : form.breadcrumbs
        ? form.breadcrumbs(data)
        : [];
    const breadcrumbs: Array<BreadcrumbInfo> = screenIdBreadcrumbs.map((v): BreadcrumbInfo => {
      return form.screens[v].withScreen((s) => ({
        type: 'screen',
        screenId: v,
        label: s.breadcrumbTitle ?? v,
        clickable: s.isBreadcrumbClickable?.(data) ?? false,
      }));
    });

    return (
      <Box style={{ paddingBottom: debug ? '45vh' : undefined }}>
        <WizardBreadcrumbsProvider
          breadcrumbs={breadcrumbs}
          currentScreenId={currentScreenId}
          onNavigate={handleNavigate}
        >
          <Fragment key={currentScreenId}>
            <Box>
              <screen.render
                data={data}
                dispatch={handleDispatch}
                navigateNext={handleNext}
                navigatePrev={handlePrev}
              />
              {!hideNav && (
                <NavigationButtons
                  onBack={prevScreen ? handlePrev : undefined}
                  onNext={handleNext}
                  nextLabel={nextLabel}
                  backLabel={prevLabel}
                  nextDisabled={!isNextEnabled}
                  showBack={prevScreen !== null}
                  nextTooltipContent={nextButtonTooltip}
                />
              )}
            </Box>
          </Fragment>
        </WizardBreadcrumbsProvider>
        {debug && <DebugDrawer data={data} breadcrumbs={breadcrumbs} currentScreenId={currentScreenId} />}
      </Box>
    );
  });
}
