// Adds the sample tutorials once, on a project that has none yet.

import type { Core } from '@strapi/strapi';

import { TUTORIALS } from './tutorials-data';
import { MORE_TUTORIALS } from './tutorials-data-more';

const UID = 'api::tutorial.tutorial';

const tagIds = async (strapi: Core.Strapi, names: string[]) => {
  const tags = await strapi.documents('api::tag.tag').findMany({
    filters: { blogTag: { $in: names } },
    status: 'published',
  });
  return tags.map((tag) => tag.documentId);
};

export const seedTutorials = async (strapi: Core.Strapi) => {
  const existing = await strapi.documents(UID).count({});
  if (existing > 0) return;

  for (const { topics, publish, ...data } of [...TUTORIALS, ...MORE_TUTORIALS]) {
    await strapi.documents(UID).create({
      data: { ...data, topics: await tagIds(strapi, topics) },
      status: publish ? 'published' : undefined,
    });
  }

  strapi.log.info(`Seeded ${TUTORIALS.length + MORE_TUTORIALS.length} sample tutorials.`);
};
