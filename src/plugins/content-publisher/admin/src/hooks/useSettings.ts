// hooks/useSettings.ts
//
// Loads everything the settings page needs in one request. Each section saves its own
// slice and hands the response back through `applySaved`, so the page always shows what
// the server actually stored rather than what was typed.

import { useEffect, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import type { Settings, SettingsResponse } from '../utils/settingsTypes';

export const useSettings = () => {
  const { get } = useFetchClient();

  const [data, setData] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await get<SettingsResponse>('/content-publisher/settings');
        setData(response.data);
      } catch (err) {
        setError('Could not load your settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const applySaved = (settings: Settings) =>
    setData((current) => (current ? { ...current, settings } : current));

  return { data, loading, error, setError, applySaved };
};
