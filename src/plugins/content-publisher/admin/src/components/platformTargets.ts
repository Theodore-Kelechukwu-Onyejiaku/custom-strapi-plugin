// components/platformTargets.ts
//
// The publish surfaces — the table and the content-manager panel — share this list, so a
// new platform is wired into both at once. The settings page gets its list from the server.

import type React from 'react';

import MediumIcon from './MediumIcon';
import DevToIcon from './DevToIcon';
import BlueskyIcon from './BlueskyIcon';
import LinkedInIcon from './LinkedInIcon';
import FacebookIcon from './FacebookIcon';

export type PlatformTarget = {
  // the platform's key on the server (server/src/platforms/)
  key: string;
  label: string;
  Icon: React.ComponentType;
  // the attribute on the tracking post that holds the published URL
  linkField: string;
};

// One route for every platform (server/src/routes/posts.ts). Only the post's id is sent,
// in the path: the server loads the post itself.
export const publishPath = (target: PlatformTarget, postId: string) =>
  `/content-publisher/posts/${postId}/publish/${target.key}`;

export const PLATFORM_TARGETS: PlatformTarget[] = [
  {
    key: 'medium',
    label: 'Medium',
    Icon: MediumIcon,
    linkField: 'mediumLink',
  },
  {
    key: 'devTo',
    label: 'Dev.to',
    Icon: DevToIcon,
    linkField: 'devToLink',
  },
  {
    key: 'bluesky',
    label: 'Bluesky',
    Icon: BlueskyIcon,
    linkField: 'blueskyLink',
  },
  {
    key: 'linkedIn',
    label: 'LinkedIn',
    Icon: LinkedInIcon,
    linkField: 'linkedInLink',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    Icon: FacebookIcon,
    linkField: 'facebookLink',
  },
];
