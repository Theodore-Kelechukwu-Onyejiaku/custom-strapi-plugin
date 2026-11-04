// hooks/usePlatformMapping.ts
//
// Holds one platform's in-progress mapping and saves it. Kept out of the card so the card
// is only markup.

import { useState } from 'react';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { ITEM_SUFFIX } from '../utils/settingsTypes';
import type { PlatformMap, Settings } from '../utils/settingsTypes';

type Options = {
  platformKey: string;
  platformLabel: string;
  saved: PlatformMap;
  onSaved: (settings: Settings) => void;
  onError: (message: string) => void;
};

export const usePlatformMapping = (options: Options) => {
  const { put } = useFetchClient();
  const { toggleNotification } = useNotification();

  const [mapping, setMapping] = useState<PlatformMap>(options.saved ?? {});
  const [saved, setSaved] = useState(JSON.stringify(options.saved ?? {}));
  const [saving, setSaving] = useState(false);

  // so the Save button can say whether there is anything left to save
  const isDirty = JSON.stringify(mapping) !== saved;

  const setField = (uid: string, key: string, value: string | null) => {
    setMapping((current) => {
      const fieldMap = { ...(current[uid] ?? {}), [key]: value };
      // picking a different relation invalidates the item attribute chosen for the old one
      if (!key.endsWith(ITEM_SUFFIX)) delete fieldMap[`${key}${ITEM_SUFFIX}`];
      return { ...current, [uid]: fieldMap };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const url = `/content-publisher/settings/platforms/${options.platformKey}`;
      const { data } = await put<Settings>(url, { mapping });
      setSaved(JSON.stringify(mapping));
      options.onSaved(data);
      toggleNotification({
        type: 'success',
        message: `Saved your ${options.platformLabel} mapping.`,
      });
    } catch (err: any) {
      const fallback = `Could not save your ${options.platformLabel} mapping.`;
      options.onError(err?.response?.data?.error?.message ?? fallback);
    } finally {
      setSaving(false);
    }
  };

  return { mapping, setField, save, saving, isDirty };
};
