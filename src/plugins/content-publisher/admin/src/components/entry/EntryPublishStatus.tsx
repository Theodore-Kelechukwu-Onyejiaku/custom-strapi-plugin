// components/entry/EntryPublishStatus.tsx
//
// The one line under the publish menu. The menu closes when a platform is picked, so this
// is where "Publishing to …" shows while the request runs.

import { Flex, Typography } from '@strapi/design-system';
import { Check } from '@strapi/icons';

import type { PlatformTarget } from '../platformTargets';

type Props = {
  platforms: PlatformTarget[];
  busy: string | null;
  publishedCount: number;
};

export const EntryPublishStatus = ({ platforms, busy, publishedCount }: Props) => {
  const busyLabel = platforms.find((target) => target.key === busy)?.label;

  if (busyLabel) {
    return (
      <Typography variant="pi" textColor="neutral600">
        {`Publishing to ${busyLabel}…`}
      </Typography>
    );
  }

  // checked first: with every platform turned off, "0 of 0" is not "published everywhere"
  if (platforms.length === 0) {
    return (
      <Typography variant="pi" textColor="neutral600">
        No platforms are turned on in Publishing settings.
      </Typography>
    );
  }

  if (publishedCount < platforms.length) return null;

  return (
    <Flex gap={1} alignItems="center">
      <Check fill="success600" width="1.2rem" height="1.2rem" />
      <Typography variant="pi" textColor="success600">
        Published everywhere
      </Typography>
    </Flex>
  );
};
