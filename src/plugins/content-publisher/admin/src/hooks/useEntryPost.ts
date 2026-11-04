// hooks/useEntryPost.ts
//
// The tracking post for the entry open in the Content Manager, looked up by content type
// and entry id so it works for any configured collection type. `post` is null when the
// entry has no tracking record yet, which means it has not been saved.
//
// `refreshKey` is the entry's publish status in the Content Manager: when the editor
// publishes or unpublishes it, the post is fetched again so `entryPublished` is current.

import { useCallback, useEffect, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

import type { TrackedPost } from '../utils/trackedPost';

type Args = { contentType: string; entryId?: string; enabled: boolean; refreshKey?: string };

export const useEntryPost = ({ contentType, entryId, enabled, refreshKey }: Args) => {
  const { get } = useFetchClient();
  const [post, setPost] = useState<TrackedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const fetchPost = useCallback(async () => {
    const query = `contentType=${encodeURIComponent(contentType)}&entryId=${entryId}`;
    const { data } = await get<TrackedPost | null>(`/content-publisher/posts/by-entry?${query}`);
    return data ?? null;
  }, [get, contentType, entryId]);

  useEffect(() => {
    if (!enabled || !entryId) {
      setPost(null);
      setLoading(false);
      return;
    }

    // the edit view stays mounted while moving between entries, so a slower earlier
    // request must not overwrite a newer one
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const found = await fetchPost();
        if (cancelled) return;
        setPost(found);
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, entryId, refreshKey, fetchPost]);

  // after a publish: refetch the post rather than reloading the admin panel
  const reload = useCallback(async () => {
    try {
      setPost(await fetchPost());
    } catch {
      // keep showing the last known state; the publish toast already said what happened
    }
  }, [fetchPost]);

  return { post, loading, failed, reload };
};
