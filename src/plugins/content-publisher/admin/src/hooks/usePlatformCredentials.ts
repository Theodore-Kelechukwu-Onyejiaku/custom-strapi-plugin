// hooks/usePlatformCredentials.ts
//
// Saves one platform's API keys. The key is write-only: it goes up, and only a summary
// comes back, so there is no local state holding a secret beyond the input being typed in.

import { useState } from 'react';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import type { Settings } from '../utils/settingsTypes';

type Options = {
  platformKey: string;
  onSaved: (settings: Settings) => void;
  onError: (message: string) => void;
};

export const usePlatformCredentials = ({ platformKey, onSaved, onError }: Options) => {
  const { put } = useFetchClient();
  const { toggleNotification } = useNotification();

  // the name of the credential currently saving, so only its button spins
  const [saving, setSaving] = useState<string | null>(null);

  const save = async (name: string, value: string) => {
    setSaving(name);
    try {
      const url = `/content-publisher/settings/platforms/${platformKey}/credentials`;
      const { data } = await put<Settings>(url, { name, value });
      onSaved(data);
      toggleNotification({
        type: 'success',
        message: value === '' ? `Cleared ${name}.` : `Saved ${name}.`,
      });
    } catch (err: any) {
      onError(err?.response?.data?.error?.message ?? `Could not save ${name}.`);
    } finally {
      setSaving(null);
    }
  };

  return { save, saving };
};
