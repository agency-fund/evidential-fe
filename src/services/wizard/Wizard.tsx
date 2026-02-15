'use client';
import { Fragment, useState } from 'react';
import { BreadcrumbInfo, NavigationSource, NavigationTask, WizardForm } from './wizard-types';
import { DebugDrawer } from './wizard-debug-drawer';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { WizardBreadcrumbs, WizardBreadcrumbsProvider } from './wizard-breadcrumbs-context';
import { Box } from '@radix-ui/themes';

type NextTask<ScreenId extends string> = { type: 'screen'; id: ScreenId } | { type: 'submit' };
type PrevTask<ScreenId extends string> = null | { type: 'screen'; id: ScreenId } | { type: 'wizard-exit-left' };

const prevFromFlow = <ScreenId extends string>(flow: Array<ScreenId>, current: ScreenId): PrevTask<ScreenId> => {
  const index = flow.indexOf(current);
  if (index < 0) {
    throw new Error(`No prevScreen provided and current screen ${current} is not present in breadcrumbs`);
  }
  const prev = flow[index - 1];
  return prev ? { type: 'screen', id: prev } : null;
};

const nextFromFlow = <ScreenId extends string>(flow: Array<ScreenId>, current: ScreenId): NextTask<ScreenId> => {
  const index = flow.indexOf(current);
  if (index < 0) {
    throw new Error(`No nextScreen provided and current screen ${current} is not present in breadcrumbs`);
  }
  const next = flow[index + 1];
  return next ? { type: 'screen', id: next } : { type: 'submit' };
};

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
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Get current packed screen by id (direct object access instead of array.find)
  const currentPackedScreen = form.screens[currentScreenId];

  // Use CPS pattern to render the screen with full type safety
  return currentPackedScreen.withScreen((screen) => {
    const handleDispatch = (message: Parameters<typeof screen.reducer>[1]) => {
      console.log('handleDispatch', message);
      setData((prev) => screen.reducer(prev, message));
    };

    const screenIdBreadcrumbs = screen.breadcrumbs
      ? screen.breadcrumbs(data)
      : form.breadcrumbs
        ? form.breadcrumbs(data)
        : [];
    const resolvePrevScreen = (): PrevTask<ScreenId> => {
      if (screen.prevScreen) {
        return screen.prevScreen(data);
      }
      return prevFromFlow(screenIdBreadcrumbs, currentScreenId);
    };
    const resolveNextScreen = (): NextTask<ScreenId> => {
      if (screen.nextScreen) {
        return screen.nextScreen(data);
      }
      return nextFromFlow(screenIdBreadcrumbs, currentScreenId);
    };

    const runBeforeNavigateAway = async (source: NavigationSource, target: NavigationTask<ScreenId>) => {
      if (!screen.beforeNavigateAway) {
        return true;
      }
      const result = await screen.beforeNavigateAway(data, {
        source,
        fromScreenId: currentScreenId,
        target,
      });
      return result !== false;
    };

    const executeNavigationTask = (task: Exclude<NavigationTask<ScreenId>, null>) => {
      switch (task.type) {
        case 'screen':
          setCurrentScreenId(task.id);
          break;
        case 'submit':
          if (onSubmit) {
            onSubmit(data);
          }
          break;
        case 'wizard-exit-left':
          if (onPrev) {
            onPrev(data);
          }
          break;
      }
    };

    const navigateWithGuard = async (source: NavigationSource, target: NavigationTask<ScreenId>) => {
      if (target === null || isTransitioning) {
        return;
      }

      setIsTransitioning(true);
      try {
        const shouldContinue = await runBeforeNavigateAway(source, target);
        if (!shouldContinue) {
          return;
        }
        executeNavigationTask(target);
      } finally {
        setIsTransitioning(false);
      }
    };

    const handleNext = async () => {
      const task = resolveNextScreen();
      await navigateWithGuard('next', task);
    };

    const handlePrev = async () => {
      const task = resolvePrevScreen();
      await navigateWithGuard('prev', task);
    };

    const handleNavigate = async (screenId: string) => {
      await navigateWithGuard('breadcrumb', { type: 'screen', id: screenId as ScreenId });
    };

    const handleNavigateTo = async (screenId: ScreenId) => {
      await navigateWithGuard('navigate-to', { type: 'screen', id: screenId });
    };

    const isPrevEnabled = screen.isPrevEnabled === undefined ? true : screen.isPrevEnabled(data);
    const prevScreen = resolvePrevScreen();
    const isNextEnabled = screen.isNextEnabled === undefined ? true : screen.isNextEnabled(data);
    const nextScreen = resolveNextScreen();

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
    const nextButtonTooltip = screen.nextButtonTooltip?.(data) ?? undefined;

    const breadcrumbs: Array<BreadcrumbInfo> = screenIdBreadcrumbs.map((v): BreadcrumbInfo => {
      return form.screens[v].withScreen((s) => ({
        type: 'screen',
        screenId: v,
        label: s.breadcrumbTitle ?? v,
        clickable: s.isBreadcrumbClickable === undefined ? true : s.isBreadcrumbClickable(data),
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
              <WizardBreadcrumbs />
              <screen.render
                data={data}
                dispatch={handleDispatch}
                navigateNext={handleNext}
                navigatePrev={handlePrev}
                navigateTo={handleNavigateTo}
              />
              {!hideNav && (
                <NavigationButtons
                  onBack={prevScreen ? handlePrev : undefined}
                  onNext={nextScreen ? handleNext : undefined}
                  backLabel={prevLabel}
                  nextLabel={nextLabel}
                  prevDisabled={!isPrevEnabled || isTransitioning}
                  nextDisabled={!isNextEnabled || isTransitioning}
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
