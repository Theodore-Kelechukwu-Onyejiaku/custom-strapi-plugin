// components/entry/EntryPublishMenu.tsx
//
// The dropdown in the edit view's narrow Actions panel: "View on …" for each platform the
// entry is already on, "Publish to …" for the rest. It scrolls once there are more
// platforms than fit.

import { Menu, Typography } from '@strapi/design-system';
import { ExternalLink } from '@strapi/icons';

import type { PlatformTarget } from '../platformTargets';
import { linkOf, type TrackedPost } from '../../utils/trackedPost';
import { EntryPublishStatus } from './EntryPublishStatus';

type Props = {
  post: TrackedPost;
  platforms: PlatformTarget[];
  // key of the platform being published to right now, from usePublishRow
  busy: string | null;
  onPublish: (targets: PlatformTarget[]) => void;
  // without the "Publish posts" permission only the "View on …" links are offered
  canPublish: boolean;
};

export const EntryPublishMenu = ({ post, platforms, busy, onPublish, canPublish }: Props) => {
  const publishedCount = platforms.filter((target) => linkOf(post, target)).length;
  const shown = canPublish ? platforms : platforms.filter((target) => linkOf(post, target));

  if (shown.length === 0 && platforms.length > 0) {
    return (
      <Typography variant="pi" textColor="neutral600">
        Not published anywhere yet. Your role cannot publish.
      </Typography>
    );
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger variant="secondary" fullWidth loading={Boolean(busy)} disabled={Boolean(busy)}>
          {`${publishedCount} of ${platforms.length} published`}
        </Menu.Trigger>

        <Menu.Content popoverPlacement="bottom-start" maxHeight="20rem" overflow="auto" width="100%">
          {shown.map((target) => {
            const url = linkOf(post, target);
            const { Icon } = target;

            return url ? (
              <Menu.Item key={target.key} isExternal href={url} startIcon={<Icon />} endIcon={<ExternalLink />}>
                {`View on ${target.label}`}
              </Menu.Item>
            ) : (
              <Menu.Item key={target.key} startIcon={<Icon />} onSelect={() => onPublish([target])}>
                {`Publish to ${target.label}`}
              </Menu.Item>
            );
          })}
        </Menu.Content>
      </Menu.Root>

      <EntryPublishStatus platforms={platforms} busy={busy} publishedCount={publishedCount} />
    </>
  );
};
