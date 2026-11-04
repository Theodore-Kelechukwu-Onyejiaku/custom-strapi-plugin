// routes/chat.ts
//
// The chat window's routes. Behind the same `read` action as the publishing table: the
// chat can do nothing the table does not already let that editor do.

import { READ } from '../permissions';
import { can } from './can';

export default [
  {
    method: 'POST',
    path: '/chat',
    handler: 'chat.send',
    config: can(READ),
  },
  {
    // the Claude models the editor can pick from in the chat
    method: 'GET',
    path: '/chat/models',
    handler: 'chat.models',
    config: can(READ),
  },
];
