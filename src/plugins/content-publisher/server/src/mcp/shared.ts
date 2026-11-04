// mcp/shared.ts
//
// What the plugin's MCP tools have in common. They are reachable from any MCP client (the
// chat in the admin panel, Claude Desktop, Cursor …), so each one is gated by its own RBAC
// action (see TOOL_* in permissions.ts).

//
// The tools hold no logic of their own: like the controllers, they call the plugin's
// registered services, so a rule changed there applies to the table and the chat alike.

import type { Core } from '@strapi/strapi';

import { PLATFORMS } from '../platforms';

// An admin token (or role) only sees a tool if it was granted that tool's permission,
// under Plugins → Content Publisher → AI tools.
export const authFor = (action: string) => ({
  policies: [{ action }] as [{ action: string }],
});

// The same services the controllers call: 'service' (posts) and 'setting'.
export const pluginService = (strapi: Core.Strapi, name: 'service' | 'setting') =>
  strapi.plugin('content-publisher').service(name);

export const PLATFORM_KEYS = PLATFORMS.map((platform) => platform.key) as [string, ...string[]];

// A successful tool result: a short line plus the data it describes. The data goes in the
// text too, as JSON (the MCP spec asks for this): the chat's AI SDK client hands the model
// only the text, so without it the model saw "11 post(s)." and no post IDs.
export const ok = <T extends Record<string, unknown>>(text: string, data: T) => ({
  content: [{ type: 'text' as const, text: `${text}\n${JSON.stringify(data)}` }],
  structuredContent: data,
});

// A failed tool result. The model reads the message and can tell the editor what to fix.
export const failed = (text: string) => ({
  content: [{ type: 'text' as const, text }],
  isError: true as const,
});
