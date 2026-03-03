'use client';
import Link from 'next/link';
import { Button } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';

export function CreateExperimentButton() {
  return (
    <Link href={`/experiments/create`}>
      <Button>
        <PlusIcon /> Create Experiment
      </Button>
    </Link>
  );
}
