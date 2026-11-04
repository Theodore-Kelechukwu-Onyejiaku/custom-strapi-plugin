// services/mapping-validator.ts
//
// Checks a platform mapping before it reaches the core store. The store accepts any JSON,
// so without this a stale or mistyped attribute name saves happily and only fails later,
// at publish time, with an error that points nowhere near the real cause.

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { ITEM_SUFFIX } from '../platforms';
import type { Platform } from '../platforms';
import { getContentType, isCollectionType } from './content-types';

const { ValidationError } = errors;

// A relation field stores two values: `tags` names the relation on the collection type,
// and `tags__item` names the attribute on the *related* type that holds the text. So an
// item key is checked against the target, not against the type being published.
const checkItem = (strapi: Core.Strapi, contentType: any, fieldMap: any, fieldKey: string, name: string) => {
  const relation = contentType.attributes?.[fieldMap[fieldKey]];
  const target = relation?.target ? getContentType(strapi, relation.target) : null;

  if (target && !target.attributes?.[name]) {
    throw new ValidationError(`"${name}" does not exist on ${relation.target}`);
  }
};

export const validateMapping = (strapi: Core.Strapi, platform: Platform, value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError('The mapping must be an object keyed by content type uid');
  }

  const fieldKeys = new Set(platform.fields.map((field) => field.key));

  for (const [uid, fieldMap] of Object.entries(value as Record<string, any>)) {
    if (!isCollectionType(strapi, uid)) {
      throw new ValidationError(`"${uid}" is not a collection type`);
    }

    const contentType = getContentType(strapi, uid);

    for (const [key, name] of Object.entries(fieldMap ?? {})) {
      // unmapped optional fields are stored as null and need no checking
      if (name === null || name === '') continue;

      const isItem = key.endsWith(ITEM_SUFFIX);
      const fieldKey = isItem ? key.slice(0, -ITEM_SUFFIX.length) : key;

      if (!fieldKeys.has(fieldKey)) {
        throw new ValidationError(`"${fieldKey}" is not a ${platform.label} field`);
      }

      if (isItem) {
        checkItem(strapi, contentType, fieldMap, fieldKey, name as string);
      } else if (!contentType.attributes?.[name as string]) {
        throw new ValidationError(`"${name}" does not exist on ${uid}`);
      }
    }
  }
};
