import { Flex, Pagination, PageLink, PreviousLink, NextLink } from '@strapi/design-system';
import type { FormEvent } from 'react';

// Windowed: the old version rendered every page as a link, so forty pages meant forty links
// across the footer. Two either side of the current page is enough to navigate by.
const WINDOW = 2;

const pagesAround = (page: number, pageCount: number) => {
  const first = Math.max(1, Math.min(page - WINDOW, pageCount - WINDOW * 2));
  const last = Math.min(pageCount, Math.max(page + WINDOW, WINDOW * 2 + 1));

  const pages = [];
  for (let n = first; n <= last; n += 1) pages.push(n);
  return pages;
};

const TablePagination = ({ page, pageCount, onChange }: any) => {
  if (pageCount <= 1) return null;

  return (
    <Flex justifyContent="flex-end">
      <Pagination activePage={page} pageCount={pageCount}>
        <PreviousLink onClick={(e: FormEvent) => onChange(e, page - 1)}>
          Go to previous page
        </PreviousLink>
        {pagesAround(page, pageCount).map((number) => (
          <PageLink key={number} number={number} onClick={(e: FormEvent) => onChange(e, number)}>
            {`Go to page ${number}`}
          </PageLink>
        ))}
        <NextLink onClick={(e: FormEvent) => onChange(e, page + 1)}>Go to next page</NextLink>
      </Pagination>
    </Flex>
  );
};

export default TablePagination;
