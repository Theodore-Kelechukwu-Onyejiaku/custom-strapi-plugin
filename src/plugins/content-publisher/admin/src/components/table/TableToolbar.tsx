import { Box, Flex, IconButton, Searchbar, SearchForm, Typography } from '@strapi/design-system';
import { ArrowClockwise } from '@strapi/icons';
import type { FormEvent } from 'react';

// Search on the left, a count and a refresh on the right. The count matters because the page
// shows five rows at a time and there was previously nothing saying how many there were.
const TableToolbar = ({ search, setSearch, onSearch, onClear, onRefresh, total, loading }: any) => (
  <Flex justifyContent="space-between" alignItems="center" gap={4} wrap="wrap">
    <Box width="320px">
      <SearchForm
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <Searchbar
          size="M"
          name="searchbar"
          value={search}
          onChange={(event: any) => setSearch(event.target.value)}
          onClear={onClear}
          clearLabel="Clear search"
          placeholder="Search by blog title"
        >
          Search for a blog
        </Searchbar>
      </SearchForm>
    </Box>

    <Flex gap={3} alignItems="center">
      <Typography variant="pi" textColor="neutral600">
        {total === 1 ? '1 entry' : `${total} entries`}
      </Typography>
      <IconButton label="Refresh" variant="tertiary" onClick={onRefresh} disabled={loading}>
        <ArrowClockwise />
      </IconButton>
    </Flex>
  </Flex>
);

export default TableToolbar;
