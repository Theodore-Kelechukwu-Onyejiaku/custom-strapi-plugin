// services/chat/agent.ts
//
// The chat's agent: Claude, through the Vercel AI SDK, looping over the MCP tools until it
// has an answer. Publishing pauses for the editor to approve it in the chat window.

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { createAnthropic } from '@ai-sdk/anthropic';
import { ToolLoopAgent, stepCountIs } from 'ai';

import { openMcpTools } from './mcp-tools';
import type { ChatAccess } from './read-access';

const { ApplicationError } = errors;

type AgentOptions = {
  // what the editor's role allows (services/chat/read-access.ts)
  access: ChatAccess;
  // already checked against the allowed list (services/chat/models.ts)
  model: string;
};

const INSTRUCTIONS = `You are the assistant inside Strapi's Content Publisher plugin.
You help editors see which entries have been published where, and publish them to
Dev.to, Medium, Bluesky, LinkedIn and Facebook.

- Look things up with the tools rather than guessing. content_publisher_list_posts gives
  each post's postId and where it is already published.
- Before publishing, check content_publisher_list_platforms. If a platform is off or not
  ready, say why instead of trying.
- Only call content_publisher_publish_post for a post and platform the editor asked for.
  The editor approves each publish in the chat; if they deny it, do not retry.
- After publishing, give the editor the URL. Keep answers short.
- You only have tools for what this editor's role allows. If something they ask about has
  no tool, say their role may not have access to it.`;

// told to the model when the editor's role cannot use the publish tool
const READ_ONLY = `
- This editor's role cannot publish from the chat. If they ask to publish, say an admin
  needs to give their role "Publish posts to platforms" and, under AI tools, "Publish a post".`;

export const createChatAgent = async (strapi: Core.Strapi, { access, model }: AgentOptions) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ApplicationError('Add ANTHROPIC_API_KEY to the .env file and restart Strapi.');
  }

  const { client, tools } = await openMcpTools(strapi, access);
  const canPublish = 'content_publisher_publish_post' in tools;
  const anthropic = createAnthropic({ apiKey });

  const agent = new ToolLoopAgent({
    model: anthropic(model),
    instructions: canPublish ? INSTRUCTIONS : INSTRUCTIONS + READ_ONLY,
    tools,
    // enough to list, check and publish to a few platforms; stops a runaway loop
    stopWhen: stepCountIs(12),
    maxOutputTokens: 8192,
    // publishing is public and permanent, so the editor confirms every call
    toolApproval: { content_publisher_publish_post: 'user-approval' },
    // signs approval requests so a browser cannot forge an "approved" answer
    experimental_toolApprovalSecret: String(strapi.config.get('admin.auth.secret')),
  });

  return { agent, client };
};
