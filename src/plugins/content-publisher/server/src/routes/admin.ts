// routes/admin.ts
//
// Every admin route, split by what it is for. Add new routes to one of these files
// rather than here.

import posts from './posts';
import settings from './settings';
import connections from './connections';
import chat from './chat';

export default [...posts, ...settings, ...connections, ...chat];
