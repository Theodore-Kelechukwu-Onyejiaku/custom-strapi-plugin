import { Td, Tr, Typography, Flex, Link, Tooltip, Box } from '@strapi/design-system';

import PlatformChips from './PlatformChips';
import PublishMenu from './PublishMenu';
import DeleteDialog from './DeleteDialog';
import { usePublishRow } from '../../hooks/usePublishRow';
import { timeAgo } from '../../utils/timeAgo';

// Relative so the link keeps working outside local development.
const contentManagerUrl = (documentId: string) =>
  `/admin/content-manager/collection-types/api::blog.blog/${documentId}`;

const PostRow = ({ post, platforms, onChanged, onDelete }: any) => {
  const { publishTo, busy } = usePublishRow(post, onChanged);

  const title = post.blog?.title ?? 'Untitled';
  const documentId = post.blog?.documentId;
  const updatedAt = post.blog?.updatedAt;

  return (
    <Tr>
      <Td>
        {/* the title is the link — a separate "Open" column was a wasted column */}
        {documentId ? (
          <Link href={contentManagerUrl(documentId)}>
            <Typography fontWeight="semiBold">{title}</Typography>
          </Link>
        ) : (
          <Typography textColor="neutral800" fontWeight="semiBold">
            {title}
          </Typography>
        )}
      </Td>
      <Td>
        <Tooltip label={updatedAt ? new Date(updatedAt).toLocaleString() : 'Never updated'}>
          <Box>
            <Typography textColor="neutral600">{timeAgo(updatedAt)}</Typography>
          </Box>
        </Tooltip>
      </Td>
      <Td>
        <PlatformChips post={post} platforms={platforms} busy={busy} />
      </Td>
      <Td>
        <Flex gap={2} justifyContent="flex-end">
          <PublishMenu post={post} platforms={platforms} busy={busy} onPublish={publishTo} />
          <DeleteDialog title={title} onConfirm={() => onDelete(post.documentId)} />
        </Flex>
      </Td>
    </Tr>
  );
};

export default PostRow;
