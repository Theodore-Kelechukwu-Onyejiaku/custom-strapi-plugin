// hooks/useContentTypes.ts
//
// The collection-type selection and its save, kept out of the section so the section is
// only markup — same shape as usePlatformMapping.

import { useState } from 'react';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import type { Settings } from '../utils/settingsTypes';

type Options = {
  saved: string[];
  onSaved: (settings: Settings) => void;
  onError: (message: string) => void;
};

export const useContentTypes = ({ saved, onSaved, onError }: Options) => {
  const { put } = useFetchClient();
  const { toggleNotification } = useNotification();

  const [selected, setSelected] = useState<string[]>(saved);
  const [saving, setSaving] = useState(false);

  // nothing to save while the selection still matches what is stored
  const isDirty =
    selected.length !== saved.length || selected.some((uid) => !saved.includes(uid));

  const save = async () => {
    setSaving(true);
    try {
      const url = '/content-publisher/settings/content-types';
      const { data } = await put<Settings>(url, { contentTypes: selected });
      onSaved(data);
      toggleNotification({ type: 'success', message: 'Saved your collection types.' });
    } catch (err: any) {
      onError(err?.response?.data?.error?.message ?? 'Could not save your collection types.');
    } finally {
      setSaving(false);
    }
  };

  return { selected, setSelected, save, saving, isDirty };
};
