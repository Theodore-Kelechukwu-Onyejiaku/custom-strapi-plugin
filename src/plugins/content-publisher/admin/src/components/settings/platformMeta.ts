// components/settings/platformMeta.ts
//
// Icons and copy per platform. Which platforms exist, and what fields each one needs,
// comes from the server — this only decorates that list.

import MediumIcon from '../MediumIcon';
import DevToIcon from '../DevToIcon';
import BlueskyIcon from '../BlueskyIcon';
import LinkedInIcon from '../LinkedInIcon';
import FacebookIcon from '../FacebookIcon';

export const PLATFORM_META: Record<string, { Icon: any; description: string }> = {
  devTo: { Icon: DevToIcon, description: 'Cross-post the full article body to Dev.to.' },
  medium: { Icon: MediumIcon, description: 'Cross-post the full article body to Medium.' },
  linkedIn: { Icon: LinkedInIcon, description: 'Share a link to the article as a feed post.' },
  facebook: { Icon: FacebookIcon, description: 'Share a link to the article on a Facebook Page.' },
  bluesky: {
    Icon: BlueskyIcon,
    description: 'Post a short line with a link card back to the article.',
  },
};
