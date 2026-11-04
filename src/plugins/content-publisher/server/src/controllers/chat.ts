// controllers/chat.ts
//
// Streams the chat agent's answer back to the admin panel in the AI SDK's UI message format,
// which `useChat` on the other side understands.

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { pipeAgentUIStreamToResponse } from 'ai';

import { createChatAgent } from '../services/chat/agent';
import { chatModels, defaultModel, resolveModel } from '../services/chat/models';
import { chatAccess } from '../services/chat/read-access';

const { ValidationError } = errors;

const chatController = ({ strapi }: { strapi: Core.Strapi }) => ({
  // GET /chat/models: what the model picker offers, and which one it starts on
  async models(ctx) {
    ctx.body = { models: chatModels(), defaultModel: defaultModel() };
  },

  async send(ctx) {
    const messages = ctx.request.body?.messages;
    if (!Array.isArray(messages)) {
      throw new ValidationError('messages must be an array of chat messages');
    }

    // The chat reaches the tools with the server's MCP token, not the editor's own rights, so
    // the editor's role is checked here: the chat only gets the tools that role allows.
    const access = chatAccess(strapi, ctx.state.userAbility);

    // Anything missing (API key, MCP token) throws here, before streaming starts, so the
    // plugin-errors middleware still turns it into a readable JSON error.
    // the editor's pick, if it is an allowed model; otherwise the default
    const model = resolveModel(ctx.request.body?.model);
    const { agent, client } = await createChatAgent(strapi, { access, model });

    // From here the AI SDK writes the response itself, as a stream.
    ctx.respond = false;
    try {
      await pipeAgentUIStreamToResponse({
        response: ctx.res,
        agent,
        uiMessages: messages,
        onFinish: () => client.close(),
        // the detail goes to the server log; the browser only gets a generic line
        onError: (error) => {
          strapi.log.error('[content-publisher] chat error', error);
          return 'The assistant ran into an error. Check the Strapi logs for details.';
        },
      });
    } catch (error) {
      await client.close();
      throw error;
    }
  },
});

export default chatController;
