import { Badge, Flex, Link, Typography } from '@strapi/design-system';

import { Cell } from './tableParts';
import PlatformStatus from './PlatformStatus';
import PublishMenu from './PublishMenu';
import DeleteDialog from './DeleteDialog';
import { usePublishRow } from '../../hooks/usePublishRow';
import formattedDate from '../../utils/formattedDate';
import { contentManagerUrl, contentTypeLabel } from '../../utils/contentType';

// Long titles are cut, but only add the ellipsis when something was actually removed.
const truncate = (text: unknown, max = 40) => {
  if (typeof text !== 'string' || text.length === 0) return '—';
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

// One row. The platforms share a single status cell and a single menu, so the row is the same
// width with ten platforms as with two. The publish menu and delete button only show when
// the role has those permissions (`onDelete` is left out when it cannot delete).
const PostCells = ({ post, platforms, onChanged, onDelete, canPublish }: any) => {
  const { publishTo, busy } = usePublishRow(post, onChanged);
  const href = contentManagerUrl(post.contentType, post.entryId);

  return (
    <>
      <Cell>
        <Badge>{contentTypeLabel(post.contentType)}</Badge>
      </Cell>
      <Cell>
        {href ? (
          <Link href={href}>
            <Typography fontWeight="semiBold">{truncate(post.title)}</Typography>
          </Link>
        ) : (
          <Typography textColor="neutral800" fontWeight="semiBold">
            {truncate(post.title)}
          </Typography>
        )}
      </Cell>
      <Cell>
        <Typography textColor="neutral600">{formattedDate(post.entryUpdatedAt)}</Typography>
      </Cell>
      <Cell>
        <PlatformStatus post={post} platforms={platforms} busy={busy} />
      </Cell>
      <Cell>
        <Flex gap={2} justifyContent="flex-end">
          {canPublish ? (
            <PublishMenu post={post} platforms={platforms} busy={busy} onPublish={publishTo} />
          ) : null}
          {onDelete ? (
            <DeleteDialog
              title={post.title ?? 'this entry'}
              onConfirm={() => onDelete(post.documentId)}
            />
          ) : null}
        </Flex>
      </Cell>
    </>
  );
};

export default PostCells;
