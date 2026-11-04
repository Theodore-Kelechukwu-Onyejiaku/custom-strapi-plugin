// mcp/list-platforms.ts
//
// Which platforms can be published to right now, and if not, why — so the model can tell
// the editor "LinkedIn isn't connected" instead of attempting a publish that will fail.
// The check itself is the setting service's platformStatus().

import { ai } from '@strapi/strapi';
import { z } from '@strapi/utils';

import { TOOL_LIST_PLATFORMS } from '../permissions';
import { authFor, ok, pluginService } from './shared';

export default ai.mcp.defineTool({
  name: 'content_publisher_list_platforms',
  title: 'List publishing platforms',
  description:
    'Lists the platforms Content Publisher can publish to, whether each is turned on, and whether its credentials or sign-in are ready.',
  auth: authFor(TOOL_LIST_PLATFORMS),
  resolveOutputSchema: () =>
    z.object({
      platforms: z.array(
        z.object({
          key: z.string(),
          label: z.string(),
          enabled: z.boolean(),
          ready: z.boolean(),
          problem: z.string().nullable(),
        })
      ),
    }),
  createHandler: (strapi) => async () => {
    const platforms = await pluginService(strapi, 'setting').platformStatus();
    return ok(`${platforms.length} platform(s).`, { platforms });
  },
});
