import { Flex } from '@strapi/design-system';
import { Filters, Pagination, SearchInput, Table } from '@strapi/strapi/admin';

import PostCells from './table/PostCells';
import { Empty, Row } from './table/tableParts';
import { buildHeaders, FILTER_OPTIONS } from './table/tableHeaders';
import { usePostsQuery } from '../hooks/usePostsQuery';
import { usePublishTargets } from '../hooks/usePublishTargets';

// Built on Strapi's own Table, Filters, SearchInput and Pagination rather than hand-rolled
// equivalents. They keep their state in the URL, so sorting, filtering, the search term and
// the page survive a refresh, are shareable, and work with the back button.
const PublishingTable = () => {
  const { platforms } = usePublishTargets();
  const { posts, pagination, isLoading, refresh, remove } = usePostsQuery();

  const headers = buildHeaders(platforms);

  return (
    <Flex direction="column" alignItems="stretch" gap={4}>
      <Flex gap={2} alignItems="center">
        <SearchInput label="Search for an entry" placeholder="Search by title" />
        <Filters.Root options={FILTER_OPTIONS}>
          <Filters.Trigger />
          <Filters.Popover />
          <Filters.List />
        </Filters.Root>
      </Flex>

      <Table.Root rows={posts} headers={headers} isLoading={isLoading}>
        <Table.Content>
          <Table.Head>
            {headers.map((header) => (
              <Table.HeaderCell key={header.name} {...header} />
            ))}
          </Table.Head>
          <Table.Loading />
          <Empty content="No content to publish yet. Create an entry in one of your selected collection types." />
          <Table.Body>
            {posts.map((post: any) => (
              <Row key={post.id}>
                <PostCells
                  post={post}
                  platforms={platforms}
                  onChanged={refresh}
                  onDelete={remove}
                />
              </Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.Root>

      <Pagination.Root pageCount={pagination.pageCount} total={pagination.total}>
        <Pagination.PageSize />
        <Pagination.Links />
      </Pagination.Root>
    </Flex>
  );
};

export default PublishingTable;
