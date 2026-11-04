// services/chat/mcp-tools.ts
//
// Connects to Strapi's own MCP server (/mcp) and picks the tools the chat may use. The MCP
// server only accepts an admin token, read from .env like every other secret here.

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { createMCPClient } from '@ai-sdk/mcp';

import { TOOL_NAMES } from '../../mcp';
import { isAllowed, type ChatAccess } from './read-access';

const { ApplicationError } = errors;

const MISSING_PERMISSION =
  'The STRAPI_MCP_TOKEN admin token cannot use the publishing tools. In Settings → Admin ' +
  'Tokens, edit it and tick the tools under Plugins → Content Publisher → AI tools.';

// The tools are filtered by what the editor's own role allows (isAllowed, read-access.ts).
export const openMcpTools = async (strapi: Core.Strapi, access: ChatAccess) => {
  const token = process.env.STRAPI_MCP_TOKEN;
  if (!token) {
    throw new ApplicationError(
      'Add STRAPI_MCP_TOKEN (an admin token) to the .env file and restart Strapi to use the chat.'
    );
  }

  const client = await createMCPClient({
    transport: {
      type: 'http',
      url: `${strapi.config.get('server.absoluteUrl')}/mcp`,
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  try {
    const all = await client.tools();

    // Strapi hides a tool from a token that lacks its permission, without an error. Say so,
    // or the model just tells the editor it "can't publish" with no idea why.
    if (!(TOOL_NAMES[0] in all)) throw new ApplicationError(MISSING_PERMISSION);

    const tools = Object.fromEntries(
      Object.entries(all).filter(([name]) => isAllowed(name, access))
    );
    return { client, tools };
  } catch (error) {
    await client.close();
    throw error;
  }
};
