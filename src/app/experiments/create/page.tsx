'use client';

import { Wizard } from '@/services/wizard/Wizard';
import { ExperimentForm } from '@/app/experiments/create/experiment-form/experiment-form-def';

export default function CreateExperimentPage() {
  return <Wizard form={ExperimentForm} debug={false} />;
}
