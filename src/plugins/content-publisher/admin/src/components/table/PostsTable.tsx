import { Table, Tbody, Th, Thead, Tr, Typography, Flex } from '@strapi/design-system';

import PostRow from './PostRow';

const HEADERS = ['Content', 'Updated', 'Published to'];

// Four columns whatever the platform count: the platforms live in one status cell rather
// than a column each, so adding a platform no longer widens the table.
const PostsTable = ({ posts, platforms, onChanged, onDelete }: any) => (
  <Table colCount={HEADERS.length + 1} rowCount={posts.length + 1}>
    <Thead>
      <Tr>
        {HEADERS.map((header) => (
          <Th key={header}>
            <Typography variant="sigma" textColor="neutral600">
              {header}
            </Typography>
          </Th>
        ))}
        <Th>
          <Flex justifyContent="flex-end">
            <Typography variant="sigma" textColor="neutral600">
              Actions
            </Typography>
          </Flex>
        </Th>
      </Tr>
    </Thead>
    <Tbody>
      {posts.map((post: any) => (
        <PostRow
          key={post.id}
          post={post}
          platforms={platforms}
          onChanged={onChanged}
          onDelete={onDelete}
        />
      ))}
    </Tbody>
  </Table>
);

export default PostsTable;
