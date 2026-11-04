// utils/contentType.ts
//
// Tracking records store a content type uid. The table needs both a readable name for it and
// a link into the content manager, and neither can be hardcoded any more now that more than
// one collection type can be published from.

// api::article.article -> Article
export const contentTypeLabel = (uid?: string) => {
  if (!uid) return 'Unknown';

  const name = uid.split('.').pop() ?? uid;
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

// Relative so the link keeps working outside local development.
export const contentManagerUrl = (uid?: string, documentId?: string) =>
  uid && documentId
    ? `/admin/content-manager/collection-types/${uid}/${documentId}`
    : undefined;
