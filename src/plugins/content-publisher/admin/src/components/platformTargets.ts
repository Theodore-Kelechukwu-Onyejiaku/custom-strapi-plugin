// components/platformTargets.ts
//
// The publish surfaces — the table and the content-manager panel — share this list, so a
// new platform is wired into both at once.
//
// The settings page deliberately does not use it: which platforms exist there comes from
// the server, because that is also where their fields and credentials are declared.

import type React from 'react';

import MediumIcon from './MediumIcon';
import DevToIcon from './DevToIcon';
import BlueskyIcon from './BlueskyIcon';

export type PlatformTarget = {
  type: string;
  // the platform's key on the server (server/src/platforms/), which is not always the same
  // spelling as `type` — the endpoint says devto, the platform definition says devTo
  key: string;
  label: string;
  Icon: React.ComponentType;
  // the attribute on the tracking post that holds the published URL
  linkField: string;
  endpoint: string;
};

export const PLATFORM_TARGETS: PlatformTarget[] = [
  {
    type: 'medium',
    key: 'medium',
    label: 'Medium',
    Icon: MediumIcon,
    linkField: 'mediumLink',
    endpoint: '/content-publisher/publish-to-medium',
  },
  {
    type: 'devto',
    key: 'devTo',
    label: 'Dev.to',
    Icon: DevToIcon,
    linkField: 'devToLink',
    endpoint: '/content-publisher/publish-to-devto',
  },
  {
    type: 'bluesky',
    key: 'bluesky',
    label: 'Bluesky',
    Icon: BlueskyIcon,
    linkField: 'blueskyLink',
    endpoint: '/content-publisher/publish-to-bluesky',
  },
];

export const getTarget = (type: string) => PLATFORM_TARGETS.find((one) => one.type === type);
