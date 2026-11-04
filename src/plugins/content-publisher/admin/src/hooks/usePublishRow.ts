// hooks/usePublishRow.ts
//
// Publishing one entry to one or more platforms. Runs them one at a time so each result is
// reportable on its own, and stops on the first failure rather than repeating it.
//
// Replaces the old window.location.reload(): the caller refetches instead, so search, page
// and scroll survive a publish.

import { useState } from 'react';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';

import { publishPath, type PlatformTarget } from '../components/platformTargets';
import type { TrackedPost } from '../utils/trackedPost';

// Shared by the publishing table (one row) and the edit-view panel (the open entry).
export const usePublishRow = (post: TrackedPost | null, onDone: () => void | Promise<void>) => {
  const { post: postRequest } = useFetchClient();
  const { toggleNotification } = useNotification();

  // which platform this row is mid-publish to, so only its chip spins
  const [busy, setBusy] = useState<string | null>(null);

  const publishTo = async (targets: PlatformTarget[]) => {
    // the edit view has no post until the entry is saved
    if (!post) return;

    for (const target of targets) {
      setBusy(target.key);

      try {
        await postRequest(publishPath(target, post.documentId));
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
