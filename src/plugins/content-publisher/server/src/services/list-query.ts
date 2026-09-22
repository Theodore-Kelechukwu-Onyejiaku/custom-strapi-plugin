// services/list-query.ts
//
// Turns the admin table's query string into document-service arguments.
//
// Only known columns are honoured: these routes are unauthenticated (PROGRESS.md item 10),
// so a stray `filters[createdBy][id]` must not become a database query.

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const DEFAULT_SORT = 'entryUpdatedAt:desc';

const SORTABLE = ['title', 'contentType', 'entryUpdatedAt'];
const FILTERABLE = ['title', 'contentType', 'mediumLink', 'devToLink', 'blueskyLink'];

const toInt = (value: unknown, fallback: number) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// SearchInput encodes its value before putting it in the URL
const decode = (value: unknown) => {
  if (typeof value !== 'string' || value === '') return '';
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
};

// "title:ASC" survives; anything naming a column we do not list falls back to the default
const cleanSort = (value: unknown) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return DEFAULT_SORT;

  const [field, direction = 'asc'] = raw.split(':');
  const dir = direction.toLowerCase();

  return SORTABLE.includes(field) && (dir === 'asc' || dir === 'desc')
    ? `${field}:${dir}`
    : DEFAULT_SORT;
};

const cleanFilters = (query: any) => {
  const and = Array.isArray(query?.filters?.$and) ? query.filters.$and : [];
  const kept = and.filter((one: any) =>
    Object.keys(one ?? {}).every((key) => FILTERABLE.includes(key))
  );

  const search = decode(query?._q);
  if (search) kept.push({ title: { $containsi: search } });

  // Always, and not overridable from the query: a draft is not something you can syndicate.
  // The record still exists, holding the URLs of anywhere it was published before.
  kept.push({ entryPublished: { $eq: true } });

  return { $and: kept };
};

export const buildListQuery = (query: any) => {
  const page = toInt(query?.page, 1);
  const pageSize = Math.min(toInt(query?.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);

  return {
    page,
    pageSize,
    start: (page - 1) * pageSize,
    sort: cleanSort(query?.sort),
    filters: cleanFilters(query),
  };
};
