// hooks/usePublishTargets.ts
//
// What the publishing table and the content-manager panel both need: which collection types
// are publishable, and which platforms are switched on. A platform turned off in the
// settings should not offer a publish button, since the server would refuse it anyway.
//
// Served by /publish-targets, which is behind the plugin's `read` action rather than
// `settings-read`, so it also works for an editor who cannot open the settings page.

import { useEffect, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

import { PLATFORM_TARGETS } from '../components/platformTargets';
import type { PlatformTarget } from '../components/platformTargets';

type TargetsResponse = {
  contentTypes: string[];
  platforms: Array<{ key: string; label: string; enabled: boolean }>;
};

export const usePublishTargets = () => {
  const { get } = useFetchClient();

  // null until known, so nothing renders against a guess
  const [contentTypes, setContentTypes] = useState<string[] | null>(null);
  const [platforms, setPlatforms] = useState<PlatformTarget[]>(PLATFORM_TARGETS);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await get<TargetsResponse>('/content-publisher/publish-targets');
        if (cancelled) return;

        const on = new Set(
          (data?.platforms ?? [])
            .filter((platform: any) => platform.enabled)
            .map((platform: any) => platform.key)
        );

        setPlatforms(PLATFORM_TARGETS.filter((target) => on.has(target.key)));
        setContentTypes(data?.contentTypes ?? []);
      } catch (error) {
        // an unreadable list is not a reason to render a broken panel
        if (!cancelled) setContentTypes([]);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { contentTypes, platforms };
};
