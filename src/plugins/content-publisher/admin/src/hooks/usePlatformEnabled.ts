// hooks/usePlatformEnabled.ts
//
// The on/off switch for one platform. Saves as soon as it is flipped — a switch that
// needed a separate Save button would not read as a switch.

import { useState } from 'react';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import type { Settings } from '../utils/settingsTypes';

type Options = {
  platformKey: string;
  platformLabel: string;
  // undefined means never set, which counts as enabled
  saved: boolean | undefined;
  onSaved: (settings: Settings) => void;
  onError: (message: string) => void;
};

export const usePlatformEnabled = (options: Options) => {
  const { put } = useFetchClient();
  const { toggleNotification } = useNotification();

  const [enabled, setEnabled] = useState(options.saved !== false);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next); // optimistic, so the switch moves under the cursor
    setSaving(true);

    try {
      const url = `/content-publisher/settings/platforms/${options.platformKey}/enabled`;
      const { data } = await put<Settings>(url, { enabled: next });
      options.onSaved(data);
      toggleNotification({
        type: 'success',
        message: `${options.platformLabel} is ${next ? 'on' : 'off'}.`,
      });
    } catch (err: any) {
      setEnabled(!next); // put it back, the server did not accept it
      const fallback = `Could not turn ${options.platformLabel} ${next ? 'on' : 'off'}.`;
      options.onError(err?.response?.data?.error?.message ?? fallback);
    } finally {
      setSaving(false);
    }
  };

  return { enabled, toggle, saving };
};
