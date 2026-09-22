// hooks/usePlatformTest.ts
//
// Checks the saved (or environment) credentials against the platform itself. The server
// answers { ok, message } rather than throwing, so a bad key reports what the platform said
// instead of a bare failure.

import { useState } from 'react';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';

type TestResult = { ok: boolean; message: string };

export const usePlatformTest = (platformKey: string, platformLabel: string) => {
  const { post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [testing, setTesting] = useState(false);

  const test = async () => {
    setTesting(true);

    try {
      const url = `/content-publisher/settings/platforms/${platformKey}/test`;
      const { data } = await post<TestResult>(url, {});

      toggleNotification({
        type: data?.ok ? 'success' : 'danger',
        message: data?.message ?? `Could not reach ${platformLabel}.`,
      });
    } catch (err: any) {
      const fallback = `Could not reach ${platformLabel}.`;
      toggleNotification({
        type: 'danger',
        message: err?.response?.data?.error?.message ?? fallback,
      });
    } finally {
      setTesting(false);
    }
  };

  return { test, testing };
};
