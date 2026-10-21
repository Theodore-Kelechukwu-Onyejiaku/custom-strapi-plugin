// hooks/usePlatformConnection.ts
//
// "Connect LinkedIn", HubSpot style: ask the server for a sign-in URL, open it in a popup,
// wait for the popup to finish, then reload the settings to see who is now connected.

import { useState } from 'react';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';

import type { Settings, SettingsResponse } from '../utils/settingsTypes';
import { waitForPopup } from '../utils/popup';

type Options = {
  platformKey: string;
  platformLabel: string;
  onSaved: (settings: Settings) => void;
  onError: (message: string) => void;
};

export const usePlatformConnection = (options: Options) => {
  const { platformKey, platformLabel, onSaved, onError } = options;
  const { get, post, put, del } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [busy, setBusy] = useState<string | null>(null);
  const base = `/content-publisher/settings/platforms/${platformKey}`;

  // wraps each action so the button spins and a failure lands in the page's error banner
  const run = async (name: string, action: () => Promise<void>) => {
    setBusy(name);
    try {
      await action();
    } catch (err: any) {
      onError(err?.response?.data?.error?.message ?? `Could not update ${platformLabel}.`);
    } finally {
      setBusy(null);
    }
  };

  const connect = () => {
    // opened inside the click, before any await, or the browser blocks it as a popup
    const popup = window.open('', 'content-publisher-connect', 'width=600,height=720');
    if (!popup) return onError('Your browser blocked the sign-in window. Allow popups and retry.');

    return run('connect', async () => {
      const started = await post<{ url: string }>(`${base}/connect`, {}).catch((err) => {
        popup.close();
        throw err;
      });
      popup.location.href = started.data.url;

      await waitForPopup(popup);
      const { data } = await get<SettingsResponse>('/content-publisher/settings');
      onSaved(data.settings);

      const account = data.settings.connections?.[platformKey]?.account;
      if (account) {
        toggleNotification({ type: 'success', message: `Connected as ${account.accountName}.` });
      }
    });
  };

  const disconnect = () =>
    run('disconnect', async () => onSaved((await del<Settings>(`${base}/connection`)).data));

  const selectPage = (pageId: string) =>
    run('page', async () =>
      onSaved((await put<Settings>(`${base}/connection/page`, { pageId })).data)
    );

  return { connect, disconnect, selectPage, busy };
};
