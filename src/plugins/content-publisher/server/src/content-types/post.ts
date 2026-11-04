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
  // Internal to the plugin: the publishing table is how editors see these records, so the
  // type is kept out of the Content Manager and the Content-Type Builder.
  pluginOptions: {
    'content-manager': {
      visible: false,
    },
    'content-type-builder': {
      visible: false,
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
    linkedInLink: {
      type: 'text',
    },
    facebookLink: {
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
  },
};

export default {
  schema,
};
