// mcp/index.ts
//
// Adds the plugin's tools to Strapi's built-in MCP server (/mcp). Strapi only accepts new
// tools while that server is idle, so this runs from register(), never bootstrap().

import type { Core } from '@strapi/strapi';

import listPosts from './list-posts';
import listPlatforms from './list-platforms';
import publishPost from './publish-post';

// Typed by hand: the inferred type points into Strapi's own copy of zod, which the build
// can't write into the .d.ts files (TS2742).
type McpTool = { name: string };

export const TOOLS: McpTool[] = [listPosts, listPlatforms, publishPost];

export const TOOL_NAMES: string[] = TOOLS.map((tool) => tool.name);

export const registerMcpTools = (strapi: Core.Strapi) => {
  const mcp = (strapi as any).ai?.mcp;
  // MCP is off unless `mcp.enabled` is set in config/server; nothing to add to then
  if (!mcp?.isEnabled?.()) return;

  TOOLS.forEach((tool) => mcp.registerTool(tool));
};
