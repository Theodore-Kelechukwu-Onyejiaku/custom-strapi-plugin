// Sample tutorials for local testing. `topics` are existing tag names (the `blogTag` field).
// The last one stays a draft, to show that Content Publisher only lists published entries.

export type SeedTutorial = {
  headline: string;
  summary: string;
  body: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  originalUrl: string;
  topics: string[];
  publish: boolean;
};

const img = (seed: string) => `![Cover](https://picsum.photos/seed/${seed}/1200/630)\n\n`;

export const TUTORIALS: SeedTutorial[] = [
  {
    headline: 'Create Your First Strapi 5 Collection Type',
    summary: 'Model a collection type in the Content-Type Builder and fetch it over REST.',
    body: `${img('first-collection')}# Create Your First Strapi 5 Collection Type

## 1. Start Strapi

\`\`\`bash
npx create-strapi@latest my-project
cd my-project && npm run develop
\`\`\`

## 2. Add the type

Open **Content-Type Builder → Create new collection type**, name it \`Recipe\`, and add a
\`title\` (Text) and an \`ingredients\` (Rich text) field. Save, and Strapi restarts.

## 3. Fetch it

Allow \`find\` for the Public role, then:

\`\`\`bash
curl http://localhost:1337/api/recipes
\`\`\``,
    difficulty: 'beginner',
    originalUrl: 'https://mystite.com/tutorials/first-strapi-5-collection-type',
    topics: ['strapi', 'cms', 'api'],
    publish: true,
  },
  {
    headline: 'Write a Custom Strapi Controller in 10 Minutes',
    summary: 'Extend a core controller to add a route that returns the three latest entries.',
    body: `${img('custom-controller')}# Write a Custom Strapi Controller in 10 Minutes

\`\`\`ts
// src/api/recipe/controllers/recipe.ts
export default factories.createCoreController('api::recipe.recipe', ({ strapi }) => ({
  async latest(ctx) {
    ctx.body = await strapi.documents('api::recipe.recipe').findMany({
      sort: { createdAt: 'desc' },
      limit: 3,
    });
  },
}));
\`\`\`

Add a custom route that points at \`recipe.latest\`, and grant it to the Public role.`,
    difficulty: 'intermediate',
    originalUrl: 'https://mystite.com/tutorials/custom-strapi-controller',
    topics: ['strapi', 'javascript', 'api'],
    publish: true,
  },
];
