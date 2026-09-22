// content-types/post.ts

const schema = {
  kind: 'collectionType',
  collectionName: 'posts',
  info: {
    singularName: 'post',
    pluralName: 'posts',
    displayName: 'Post',
  },
  options: {
    draftAndPublish: false,
  },
  pluginOptions: {
    'content-manager': {
      visible: true,
    },
    'content-type-builder': {
      visible: true,
    },
  },
  attributes: {
    mediumLink: {
      type: 'text',
    },
    devToLink: {
      type: 'text',
    },
    blueskyLink: {
      type: 'text',
    },
    // Which entry this record tracks. A uid plus a documentId rather than a relation,
    // because Strapi cannot relate to "whichever collection types the editor picked".
    contentType: {
      type: 'string',
    },
    entryId: {
      type: 'string',
    },
    // Snapshot of the entry, so listing and searching stay one query on this table instead
    // of a lookup per row across several content types. Refreshed by the lifecycles in
    // register.ts whenever the entry changes.
    title: {
      type: 'string',
    },
    entryUpdatedAt: {
      type: 'datetime',
    },
    // Whether the entry is published in the Content Manager. Kept as a flag rather than
    // deleting the record, so unpublishing hides the row without losing the note of where it
    // was already published.
    entryPublished: {
      type: 'boolean',
      default: false,
    },
    // Kept, and still written for blog entries, so the `post` field on api::blog.blog and
    // every existing row keep working. Nothing reads it any more — contentType/entryId is
    // the reference. See PROGRESS.md before removing it.
    blog: {
      type: 'relation',
      relation: 'oneToOne',
      target: 'api::blog.blog',
      inversedBy: 'post',
    },
  },
};

export default {
  schema,
};
