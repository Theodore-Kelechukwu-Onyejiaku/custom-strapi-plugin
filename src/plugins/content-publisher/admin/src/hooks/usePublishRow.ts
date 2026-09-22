// hooks/usePublishRow.ts
//
// Publishing one entry to one or more platforms. Runs them one at a time so each result is
// reportable on its own, and stops on the first failure rather than repeating it.
//
// Replaces the old window.location.reload(): the caller refetches instead, so search, page
// and scroll survive a publish.

import { useState } from 'react';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';

import type { PlatformTarget } from '../components/platformTargets';

export const usePublishRow = (post: any, onDone: () => void | Promise<void>) => {
  const { post: postRequest } = useFetchClient();
  const { toggleNotification } = useNotification();

  // which platform this row is mid-publish to, so only its chip spins
  const [busy, setBusy] = useState<string | null>(null);

  const publishTo = async (targets: PlatformTarget[]) => {
    for (const target of targets) {
      setBusy(target.type);

      try {
        await postRequest(target.endpoint, post);
        toggleNotification({ type: 'success', message: `Published to ${target.label}.` });
      } catch (err: any) {
        const fallback = `Could not publish to ${target.label}.`;
        toggleNotification({
          type: 'danger',
          message: err?.response?.data?.error?.message ?? fallback,
        });
        break;
      }
    }

    setBusy(null);
    await onDone();
  };

  return { publishTo, busy };
};
