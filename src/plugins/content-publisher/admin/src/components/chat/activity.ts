// What to call each of the plugin's tools in the chat, while it runs and once it is done.
// Any other tool (list_blog …) falls back to its MCP name.
const LABELS: Record<string, { active: string; done: string }> = {
  content_publisher_list_posts: { active: 'Looking up posts', done: 'Looked up posts' },
  content_publisher_list_platforms: { active: 'Checking platforms', done: 'Checked platforms' },
  content_publisher_publish_post: { active: 'Publishing', done: 'Published' },
};

// MCP tools arrive as dynamic tools, since their schemas are only known at runtime
export const isToolPart = (part: any) =>
  part.type === 'dynamic-tool' || part.type?.startsWith('tool-');

export const toolNameOf = (part: any): string => part.toolName ?? part.type.replace(/^tool-/, '');

export const toolLabel = (name: string, done: boolean) => {
  const label = LABELS[name];
  if (!label) return done ? `Used ${name}` : `Using ${name}`;
  return done ? label.done : label.active;
};

// Should the chat show "Thinking…" under the messages? Yes while waiting for the first
// reply, while the model reasons (its reasoning itself is hidden), and between steps (a
// tool has finished and the model is deciding what's next). Not while text or a running
// tool is on screen — those show their own progress.
export const isThinking = (messages: any[], status: string) => {
  if (status === 'submitted') return true;
  if (status !== 'streaming') return false;

  const last = messages[messages.length - 1];
  const part = last?.parts?.[last.parts.length - 1];

  if (!part || part.type === 'step-start' || part.type === 'reasoning') return true;
  return isToolPart(part) && part.state?.startsWith('output');
};
