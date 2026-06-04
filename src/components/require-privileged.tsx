'use client';
import { Text } from '@radix-ui/themes';
import { PropsWithChildren } from 'react';
import { useAuth } from '@/providers/auth-provider';

export default function RequirePrivileged({ children }: PropsWithChildren) {
  const auth = useAuth();

  if (!auth.isAuthenticated || !auth.isPrivileged) {
    return <Text>Access denied. Only privileged users can manage users.</Text>;
  }

  return children;
}
