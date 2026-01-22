'use client';

import { Wizard } from '../../../services/wizard/Wizard';
import { ExperimentForm } from '@/app/experiments/create/experiment-form-def';

export default function DefinerPage() {
  const handleSubmit = (data: typeof ExperimentForm extends { initialData: () => infer D } ? D : never) => {
    console.log('Form submitted:', data);
    // Handle form submission
  };

  return (
    <div>
      <h1>Definer</h1>
      <Wizard form={ExperimentForm} onSubmit={handleSubmit} debug={true} />
    </div>
  );
}
