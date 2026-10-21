// controllers/connection.ts
//
// Thin passthrough to the connection service. The callback is the odd one out: it answers
// the popup with a small HTML page instead of JSON, because a person is looking at it.

import type { Core } from '@strapi/strapi';

const connections = (strapi: Core.Strapi) =>
  strapi.plugin('content-publisher').service('connection');

// The message can contain text from the provider, so it is escaped before going into HTML.
// LinkedIn already sends `&quot;` in its error text, so drop that first or it shows literally.
const escapeHtml = (text: string) =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

// No script: Strapi's CSP blocks inline scripts. The settings page watches the popup and
// closes it itself once it lands back on this origin.
const resultPage = (ok: boolean, message: string) => `<!doctype html>
<html><head><meta charset="utf-8"><title>${ok ? 'Connected' : 'Not connected'}</title></head>
<body style="font-family: sans-serif; padding: 32px; color: #32324d">
  <h2>${ok ? 'Connected' : 'Something went wrong'}</h2>
  <p>${escapeHtml(message)}</p>
  <p style="color: #666687">You can close this window.</p>
</body></html>`;

const connectionController = ({ strapi }: { strapi: Core.Strapi }) => ({
  // the provider URL the settings page opens in a popup
  async start(ctx) {
    ctx.body = await connections(strapi).start(ctx.params.platform);
  },

  // where LinkedIn / Facebook send the browser back to, with ?code=&state=
  async callback(ctx) {
    const result = await connections(strapi).finish(ctx.params.platform, ctx.query ?? {});
    ctx.type = 'html';
    ctx.body = resultPage(result.ok, result.message);
  },

  async disconnect(ctx) {
    ctx.body = await connections(strapi).disconnect(ctx.params.platform);
  },

  // Facebook: choose which of the granted Pages to post as
  async selectPage(ctx) {
    const { platform } = ctx.params;
    ctx.body = await connections(strapi).selectPage(platform, ctx.request.body?.pageId);
  },
});

export default connectionController;
