import { useState } from 'react';
import { Cross, Sparkle } from '@strapi/icons';

import ChatPanel from './ChatPanel';
import { Fab } from './fabStyles';
import { Window } from './windowStyles';

// The round button in the bottom-right corner of the plugin's pages, and the chat window
// it opens. The window stays mounted while closed, so the conversation survives a toggle.
const ChatLauncher = () => {
  const [open, setOpen] = useState(false);
  const label = open ? 'Close chat' : 'Open publishing assistant';

  return (
    <>
      <Window $open={open} role="dialog" aria-label="Publishing assistant" aria-hidden={!open}>
        <ChatPanel onClose={() => setOpen(false)} />
      </Window>

      <Fab type="button" aria-label={label} title={label} onClick={() => setOpen((v) => !v)}>
        {open ? <Cross /> : <Sparkle />}
      </Fab>
    </>
  );
};

export default ChatLauncher;
