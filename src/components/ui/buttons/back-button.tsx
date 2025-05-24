'use client';

import Link from 'next/link';
import { Button } from '@radix-ui/themes';
import { ArrowLeftIcon } from '@radix-ui/react-icons';

interface BackButtonProps {
  href: string;
  label: string;
}

export function BackButton({ href, label }: BackButtonProps) {
  return (
    <Link href={href}>
      <Button variant="ghost" size="3">
        <ArrowLeftIcon /> {label}
      </Button>
    </Link>
  );
}
