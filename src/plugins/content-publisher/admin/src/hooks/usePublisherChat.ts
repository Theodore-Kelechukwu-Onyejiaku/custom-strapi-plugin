// hooks/usePublisherChat.ts
//
// The AI SDK's useChat, pointed at the plugin's /chat route. That route is behind the admin
// login, so every request carries the signed-in editor's token — read fresh each time, since
// Strapi refreshes it in the background.

import { useMemo, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';
import { useAuth } from '@strapi/strapi/admin';

const chatUrl = () => `${(window as any).strapi?.backendURL ?? ''}/content-publisher/chat`;

// The server answers setup problems (missing API key …) as Strapi JSON errors; useChat hands
// back the raw body, so pull the readable message out of it.
export const readError = (error?: Error) => {
  if (!error) return null;
  try {
    return JSON.parse(error.message)?.error?.message ?? error.message;
  } catch {
    return error.message;
  }
};

// `model` is the editor's pick from the chat's model picker; undefined means the server's
// default. It is read fresh on every request, so a change applies to the next message.
export const usePublisherChat = (model?: string) => {
  const token = useAuth('PublisherChat', (auth) => auth.token);
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const modelRef = useRef(model);
  modelRef.current = model;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: chatUrl(),
        headers: (): Record<string, string> => ({ Authorization: `Bearer ${tokenRef.current}` }),
        body: () => ({ model: modelRef.current }),
      }),
    []
  );

  return useChat({
    transport,
    // once the editor approves or denies a publish, carry on without them pressing send
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });
};
