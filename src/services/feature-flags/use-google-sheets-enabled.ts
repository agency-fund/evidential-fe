import { useAuth } from '@/providers/auth-provider';
import { useFeatureFlag } from './use-feature-flag';

export function useGoogleSheetsEnabled(): boolean {
  const enabled = useFeatureFlag('google_sheets');
  const auth = useAuth();
  return enabled && auth.isPrivileged;
}
