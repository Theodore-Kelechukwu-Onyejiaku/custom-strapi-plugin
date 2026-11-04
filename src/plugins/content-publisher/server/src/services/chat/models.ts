// services/chat/models.ts
//
// The Claude models an editor may pick in the chat. The browser only sends a model id; the
// server uses it only if it is on this list, so nobody can point the chat at an arbitrary
// (or far more expensive) model.
//
// The default is ANTHROPIC_MODEL from .env, or Claude Haiku 4.5 when that is not set.

const FALLBACK_MODEL = 'claude-haiku-4-5';

export type ChatModel = { id: string; label: string };

const CHAT_MODELS: ChatModel[] = [
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5 (fastest)' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (balanced)' },
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 (most capable)' },
];

export const defaultModel = () => process.env.ANTHROPIC_MODEL || FALLBACK_MODEL;

// The list offered in the chat: the models above, plus the .env default if it is not one
// of them, so setting ANTHROPIC_MODEL never makes the default unselectable.
export const chatModels = (): ChatModel[] => {
  const fallback = defaultModel();
  if (CHAT_MODELS.some((model) => model.id === fallback)) return CHAT_MODELS;
  return [{ id: fallback, label: fallback }, ...CHAT_MODELS];
};

// The model to run: the one requested if it is on the list, otherwise the default.
export const resolveModel = (requested: unknown) => {
  const allowed = chatModels().some((model) => model.id === requested);
  return allowed ? String(requested) : defaultModel();
};
