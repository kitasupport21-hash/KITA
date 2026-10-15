import React, { useEffect, useRef, useState } from 'react';
import { api, setClientToken } from '../lib/api.js';
import type { User } from '../shared/types.js';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void; auto_select?: boolean }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onSuccess: (user: User) => void;
  onError?: (message: string) => void;
}

const GOOGLE_SCRIPT_ID = 'google-identity-services';

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onSuccess, onError }) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '');

  useEffect(() => {
    if (!clientId || !buttonRef.current) return;

    const setup = () => {
      if (!window.google || !buttonRef.current) return;
      buttonRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: clientId,
        auto_select: false,
        callback: async (response) => {
          setLoading(true);
          try {
            const result = await api.googleLogin(response.credential);
            if (!result.success || !result.data) throw new Error('Google Login gagal.');
            setClientToken(result.data.token);
            onSuccess(result.data.user);
          } catch (error: any) {
            onError?.(error?.message || 'Google Login gagal.');
          } finally {
            setLoading(false);
          }
        }
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: 360,
        logo_alignment: 'left'
      });
    };

    const existing = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existing) {
      if (window.google) setup();
      else existing.addEventListener('load', setup, { once: true });
      return () => existing.removeEventListener('load', setup);
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = setup;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [clientId, onError, onSuccess]);

  if (!clientId) return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-center min-h-[44px]" ref={buttonRef} />
      {loading && <p className="text-center text-[10px] text-slate-500">Google se sign in ho raha hai…</p>}
    </div>
  );
};
