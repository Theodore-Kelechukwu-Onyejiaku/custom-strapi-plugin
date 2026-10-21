import { Accordion, Badge, Box, Switch } from '@strapi/design-system';

import PlatformPanel from './PlatformPanel';
import { PLATFORM_META } from './platformMeta';
import { usePlatformMapping } from '../../hooks/usePlatformMapping';
import { usePlatformEnabled } from '../../hooks/usePlatformEnabled';

// One platform as an accordion row: click the name to open its credentials and mapping.
// Collapsed by default, so the page opens as a short list rather than a wall of fields.
const PlatformCard = (props: any) => {
  const { platform, contentTypes, selectedTypes, saved, savedEnabled, canUpdate } = props;
  const { summaries, connection, onSaved, onError } = props;
  const shared = { platformKey: platform.key, platformLabel: platform.label, onSaved, onError };

  const form = usePlatformMapping({ ...shared, saved });
  const enabling = usePlatformEnabled({ ...shared, saved: savedEnabled });

  const { Icon, description } = PLATFORM_META[platform.key] ?? ({} as any);
  const types = contentTypes.filter((one: any) => selectedTypes.includes(one.uid));

  return (
    <Accordion.Item value={platform.key}>
      <Accordion.Header>
        <Accordion.Trigger icon={Icon ?? undefined} description={description}>
          {platform.label}
        </Accordion.Trigger>
        {/* Actions sit outside the trigger, so the switch does not open the row */}
        <Accordion.Actions>
          {enabling.enabled ? null : <Badge>Off</Badge>}
          <Switch
            checked={enabling.enabled}
            onCheckedChange={enabling.toggle}
            disabled={enabling.saving || !canUpdate}
            onLabel="On"
            offLabel="Off"
            aria-label={`Publish to ${platform.label}`}
          />
        </Accordion.Actions>
      </Accordion.Header>
      <Accordion.Content>
        <Box padding={4}>
          <PlatformPanel
            platform={platform}
            contentTypes={contentTypes}
            types={types}
            form={form}
            enabled={enabling.enabled}
            summaries={summaries}
            connection={connection}
            canUpdate={canUpdate}
            onSaved={onSaved}
            onError={onError}
          />
        </Box>
      </Accordion.Content>
    </Accordion.Item>
  );
};

export default PlatformCard;
