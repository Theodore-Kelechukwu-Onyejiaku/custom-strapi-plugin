// components/EntryPublishPanel.tsx
//
// The "Publish to" panel in the Content Manager's edit view (the editView.right-links zone),
// shown only on the collection types chosen in Publishing settings.
//
// This file only decides which state to show. Loading the post is useEntryPost, the menu is
// EntryPublishMenu, and publishing is usePublishRow: the same hook the publishing table
// uses, so both show the same success and error messages.

import type { ReactNode } from 'react';
import { Flex, Loader, Typography } from '@strapi/design-system';
import { unstable_useContentManagerContext, unstable_useDocument } from '@strapi/strapi/admin';

import { useEntryPost } from '../hooks/useEntryPost';
import { usePublishRow } from '../hooks/usePublishRow';
import { usePublishTargets } from '../hooks/usePublishTargets';
import { usePostPermissions } from '../hooks/usePostPermissions';
import { EntryPublishMenu } from './entry/EntryPublishMenu';

const Note = ({ children }: { children: ReactNode }) => (
  <Typography variant="pi" textColor="neutral600">
    {children}
  </Typography>
);

export default function EntryPublishPanel() {
  const { slug, id, model, collectionType } = unstable_useContentManagerContext();
  const { contentTypes, platforms } = usePublishTargets();
  const enabled = Boolean(contentTypes?.includes(slug));

  // the entry's status in the Content Manager, so publishing it there refreshes this panel
  const { document } = unstable_useDocument({ model, collectionType, documentId: id }, { skip: !enabled || !id });
  const refreshKey = String(document?.status ?? '');

  const { post, loading, failed, reload } = useEntryPost({ contentType: slug, entryId: id, enabled, refreshKey });
  const { publishTo, busy } = usePublishRow(post, reload);
  const { canPublish } = usePostPermissions();

  // render nothing until the publishable types are known, so the panel never flashes on
  // a content type it does not belong to
  if (!enabled) return null;

  let body: ReactNode;
  if (loading) {
    body = (
      <Flex justifyContent="center" padding={2}>
        <Loader small>Loading publishing status</Loader>
      </Flex>
    );
  }
  else if (failed) body = <Note>Could not load the publishing status. Reload the page to try again.</Note>;
  else if (!post) body = <Note>Save this entry first to publish it.</Note>;
  else if (!post.entryPublished) body = <Note>Publish this entry first, then publish it to other platforms.</Note>;
  else {
    body = (
      <EntryPublishMenu post={post} platforms={platforms} busy={busy} onPublish={publishTo} canPublish={canPublish} />
    );
  }

  return (
    <Flex direction="column" alignItems="stretch" gap={2} width="100%" paddingTop={4}>
      <Typography variant="sigma" textTransform="uppercase" textColor="neutral600" tag="h3">
        Publish to
      </Typography>
      {body}
    </Flex>
  );
}
