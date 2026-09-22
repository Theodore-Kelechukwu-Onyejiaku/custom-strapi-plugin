// hooks/usePublishActions.ts
//
// The request behind a row's publish button. Refetches through `onDone` rather than reloading
// the admin panel, so the search term and the page you are on survive.

import { useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

import type { PlatformTarget } from '../components/platformTargets';

export const usePublishActions = (
  post: any,
  target: PlatformTarget | undefined,
  onDone: () => void
) => {
  const { post: postRequest } = useFetchClient();
  const [loading, setLoading] = useState(false);

  const send = async (url: string) => {
    if (!target) return;

    try {
      setLoading(true);
      await postRequest(url, post);
      onDone();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return { loading, publish: () => send(target ? target.endpoint : '') };
};
