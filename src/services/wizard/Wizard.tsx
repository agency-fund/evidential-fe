'use client';
import { Fragment, useState } from 'react';
import { BreadcrumbInfo, WizardForm } from './wizard-types';
import { DebugDrawer } from './wizard-debug-drawer';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { Box } from '@radix-ui/themes';

type WizardProps<FormData, ScreenId extends string> = {
  form: WizardForm<FormData, ScreenId>;
  onSubmit: (data: FormData) => void;
  debug?: boolean;
};

export function Wizard<FormData, ScreenId extends string>({ form, onSubmit, debug }: WizardProps<FormData, ScreenId>) {
  const [data, setData] = useState<FormData>(form.initialData);
  const [currentScreenId, setCurrentScreenId] = useState<ScreenId>(() =>
    // Use form's initialScreenId to determine starting screen
    // Enables edit functionality by returning to appropriate screen based on data
    form.initialScreenId(form.initialData()),
  );

  // Get current packed screen by id (direct object access instead of array.find)
  const currentPackedScreen = form.screens[currentScreenId];

  // Use CPS pattern to render the screen with full type safety
  return currentPackedScreen.withScreen((screen) => {
    const handleDispatch = (message: Parameters<typeof screen.reducer>[1]) => {
      console.log('handleDispatch', message);
      setData((prev) => screen.reducer(prev, message));
    };

    const handleNext = () => {
      const next = screen.nextScreen(data);
      if (next.type === 'submit') {
        onSubmit(data);
      } else {
        setCurrentScreenId(next.id);
      }
    };

    const handlePrev = () => {
      const prev = screen.prevScreen(data);
      if (prev) {
        setCurrentScreenId(prev.id);
      }
    };

    const prevScreen = screen.prevScreen(data);
    const isNextEnabled = screen.isNextEnabled(data);
    const nextScreen = screen.nextScreen(data);

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
            clickable: form.screens[v].withScreen((screen) =>
              screen.isBreadcrumbClickable ? screen.isBreadcrumbClickable(data) : false,
            ),
          };
    });

    return (
      <Box style={{ paddingBottom: debug ? '45vh' : undefined }}>
        <Fragment key={currentScreenId}>
          <screen.render
            data={data}
            dispatch={handleDispatch}
            currentScreenId={currentScreenId}
            breadcrumbs={breadcrumbs}
          />
          <NavigationButtons
            onBack={prevScreen ? handlePrev : undefined}
            onNext={handleNext}
            nextLabel={nextScreen.type === 'submit' ? 'Submit' : 'Next'}
            nextDisabled={!isNextEnabled}
            showBack={prevScreen !== null}
          />
        </Fragment>
        {debug && <DebugDrawer data={data} breadcrumbs={breadcrumbs} currentScreenId={currentScreenId} />}
      </Box>
    );
  });
}
