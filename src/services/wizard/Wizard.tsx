'use client';
import { Fragment, useState } from 'react';
import { BreadcrumbInfo, WizardForm } from './wizard-types';
import { DebugDrawer } from './wizard-debug-drawer';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { WizardBreadcrumbsProvider } from './wizard-breadcrumbs-context';
import { Box } from '@radix-ui/themes';

type WizardProps<FormData, ScreenId extends string, InputData> = {
  form: WizardForm<FormData, ScreenId, InputData>;
  inputData?: InputData;
  onPrev?: (data: FormData) => void;
  onSubmit: (data: FormData) => void;
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
          onSubmit(data);
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
        case 'wizard-prop-onprev':
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

    const screenIdBreadcrumbs = screen.breadcrumbs
      ? screen.breadcrumbs(data)
      : form.breadcrumbs
        ? form.breadcrumbs(data)
        : [];
    const breadcrumbs: Array<BreadcrumbInfo> = screenIdBreadcrumbs.map((v): BreadcrumbInfo => {
      return v === null
        ? { type: 'unknown' }
        : {
            type: 'screen',
            screenId: v,
            label: form.screens[v].withScreen((s) => s.breadcrumbTitle ?? v),
            clickable: form.screens[v].withScreen((screen) =>
              screen.isBreadcrumbClickable ? screen.isBreadcrumbClickable(data) : false,
            ),
          };
    });

    return (
      <Box style={{ paddingBottom: debug ? '45vh' : undefined }}>
        <WizardBreadcrumbsProvider
          breadcrumbs={breadcrumbs}
          currentScreenId={currentScreenId}
          onNavigate={handleNavigate}
        >
          <Fragment key={currentScreenId}>
            <screen.render data={data} dispatch={handleDispatch} navigateNext={handleNext} navigatePrev={handlePrev} />
            {!hideNav && (
              <NavigationButtons
                onBack={prevScreen ? handlePrev : undefined}
                onNext={handleNext}
                nextLabel={nextLabel}
                backLabel={prevLabel}
                nextDisabled={!isNextEnabled}
                showBack={prevScreen !== null}
              />
            )}
          </Fragment>
        </WizardBreadcrumbsProvider>
        {debug && <DebugDrawer data={data} breadcrumbs={breadcrumbs} currentScreenId={currentScreenId} />}
      </Box>
    );
  });
}
