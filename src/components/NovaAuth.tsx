import { useEffect } from 'react';
import type { ApiProfile } from '../lib/novaApi';

type Props = { onAuthenticated: (profile: ApiProfile) => void };

const previewProfile: ApiProfile = {
  id: 'preview-guest',
  email: 'preview@nova.local',
  name: 'NOVA Preview',
  emailVerified: false,
  skills: [],
  preferredModes: [],
  preferredProvinces: [],
  targetLevels: [],
  minimumSalaryJt: 0,
};

// Preview mode has no login or signup screen. The workspace opens directly.
export default function NovaAuth({ onAuthenticated }: Props) {
  useEffect(() => {
    onAuthenticated(previewProfile);
  }, [onAuthenticated]);
  return null;
}
