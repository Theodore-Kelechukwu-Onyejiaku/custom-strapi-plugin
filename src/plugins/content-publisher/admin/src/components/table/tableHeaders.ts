// components/table/tableHeaders.ts
//
// Five columns, whatever the platform count. The platforms used to get a column each, which
// stopped fitting at three and would be unusable at ten — they now share one status cell and
// one action menu.
//
// `sortable` is all Strapi's Table needs to make a header clickable: it writes `sort=` into
// the URL and the server reads it. Nothing derived from a platform is sortable, because a
// publish URL is not something you order a list by.

import type { PlatformTarget } from '../platformTargets';

export const buildHeaders = (platforms: PlatformTarget[]) => [
  { name: 'contentType', label: 'Type', sortable: true },
  { name: 'title', label: 'Title', sortable: true },
  { name: 'entryUpdatedAt', label: 'Updated', sortable: true },
  {
    name: 'published',
    label: platforms.length > 0 ? `Published to (${platforms.length})` : 'Published to',
    sortable: false,
  },
  { name: 'actions', label: 'Actions', sortable: false },
];

// What the Filters button offers. Only columns the server is willing to filter on.
export const FILTER_OPTIONS = [
  { name: 'title', label: 'Title', type: 'string' as const },
  { name: 'contentType', label: 'Type', type: 'string' as const },
];
