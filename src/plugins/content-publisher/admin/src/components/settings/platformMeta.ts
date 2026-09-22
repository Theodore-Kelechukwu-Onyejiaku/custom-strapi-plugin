// components/settings/platformMeta.ts
//
// Icons and copy per platform. Which platforms exist, and what fields each one needs,
// comes from the server — this only decorates that list.

import MediumIcon from '../MediumIcon';
import DevToIcon from '../DevToIcon';
import BlueskyIcon from '../BlueskyIcon';

export const PLATFORM_META: Record<string, { Icon: any; description: string }> = {
  devTo: { Icon: DevToIcon, description: 'Cross-post the full article body to Dev.to.' },
  medium: { Icon: MediumIcon, description: 'Cross-post the full article body to Medium.' },
  linkedIn: { Icon: null, description: 'Share a link to the article as a feed post.' },
  bluesky: {
    Icon: BlueskyIcon,
    description: 'Post a short line with a link card back to the article.',
  },
};

// Platforms the page lists but the server does not describe yet, so they cannot be
// mapped. Listed anyway so the page says what is coming rather than staying silent.
// Move one out of here by adding it to server/src/platforms/.
export const PENDING_PLATFORMS = [
  { key: 'medium', label: 'Medium' },
  { key: 'linkedIn', label: 'LinkedIn' },
];
