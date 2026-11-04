import axios from 'axios';

import { publishFailed } from './errors';

// Short summary for the description field. The mapped attribute may be empty or missing.
const excerpt = (text: unknown, max = 140): string => {
  if (typeof text !== 'string' || text.length === 0) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

// `values` is keyed by the field keys declared in platforms/devto.ts, already resolved
// through the editor's mapping — nothing here knows which attribute a value came from.
export const sendToDevTo = async (
  values: Record<string, any>,
  secrets: Record<string, string | undefined>
): Promise<string> => {
  const article = {
    title: values.title,
    body_markdown: values.body_markdown,
    published: true,
    series: null,
    main_image: values.main_image,
    canonical_url: values.canonical_url,
    description: excerpt(values.description),
    tags: values.tags ?? [],
    organization_id: null,
  };

  try {
    const response = await axios.post(
      'https://dev.to/api/articles',
      { article },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': secrets.DEVTO_API_KEY,
        },
      }
    );

    return response.data?.url;
  } catch (error) {
    return publishFailed('Dev.to', error);
  }
};
