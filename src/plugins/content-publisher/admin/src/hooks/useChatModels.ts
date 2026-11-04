// hooks/useChatModels.ts
//
// The Claude models the editor can pick in the chat, and the one picked. Starts on the
// server's default (ANTHROPIC_MODEL, or Claude Haiku 4.5). If the list cannot be loaded the
// picker is simply not shown and the server uses its default.

import { useEffect, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

export type ChatModel = { id: string; label: string };

type ModelsResponse = { models: ChatModel[]; defaultModel: string };

export const useChatModels = () => {
  const { get } = useFetchClient();
  const [models, setModels] = useState<ChatModel[]>([]);
  const [model, setModel] = useState<string | undefined>(undefined);

  useEffect(() => {
    get<ModelsResponse>('/content-publisher/chat/models')
      .then(({ data }) => {
        setModels(data.models);
        setModel(data.defaultModel);
      })
      .catch(() => setModels([]));
  }, [get]);

  return { models, model, setModel };
};
