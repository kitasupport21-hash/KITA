import { useEffect } from 'react';
import type { ApiProfile } from '../lib/novaApi';

type Props = { onAuthenticated: (profile: ApiProfile) => void; initialError?: string };

const guestProfile: ApiProfile = {
  id: 'preview-guest',
  email: 'guest@preview.nova',
  name: 'NOVA Guest',
  emailVerified: false,
  skills: [],
  preferredModes: [],
  preferredProvinces: [],
  targetLevels: [],
  minimumSalaryJt: 0,
};

/**
 * Preview-only guest entry point.
 * Authentication is intentionally bypassed for the NOVA preview so the product
 * can be reviewed without creating an account. Restore the real NovaAuth form
 * before production launch.
 */
export default function NovaAuth({ onAuthenticated }: Props) {
  useEffect(() => {
    onAuthenticated(guestProfile);
  }, [onAuthenticated]);

  return null;
}
