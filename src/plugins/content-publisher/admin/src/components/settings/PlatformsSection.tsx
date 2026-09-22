import { Accordion, Box, Flex, Badge } from '@strapi/design-system';

import Section from './Section';
import PlatformCard from './PlatformCard';
import PlatformHeader from './PlatformHeader';
import { PENDING_PLATFORMS } from './platformMeta';
import type { ContentType, Platform, Settings } from '../../utils/settingsTypes';

const HINT =
  'Where your content gets published. Click a platform to map its fields onto the collection types above.';

type Props = {
  platforms: Platform[];
  contentTypes: ContentType[];
  settings: Settings;
  canUpdate: boolean;
  onSaved: (settings: Settings) => void;
  onError: (message: string) => void;
};

const PlatformsSection = (props: Props) => {
  const { platforms, contentTypes, settings, canUpdate, onSaved, onError } = props;
  // a platform the server describes is configurable, so drop it from the pending list
  const served = platforms.map((platform) => platform.key);
  const pending = PENDING_PLATFORMS.filter((one) => !served.includes(one.key));

  return (
    <Section title="Platforms" hint={HINT}>
      <Flex direction="column" alignItems="stretch" gap={4}>
        {/* one open at a time, and `collapsible` lets you close it again */}
        <Accordion.Root collapsible>
          {platforms.map((platform: Platform) => (
            <PlatformCard
              key={platform.key}
              platform={platform}
              contentTypes={contentTypes}
              selectedTypes={settings.contentTypes}
              saved={settings.platforms[platform.key] ?? {}}
              savedEnabled={settings.enabled?.[platform.key]}
              summaries={settings.credentials?.[platform.key] ?? {}}
              canUpdate={canUpdate}
              onSaved={onSaved}
              onError={onError}
            />
          ))}
        </Accordion.Root>

        {pending.map(({ key, label }) => (
          <Flex
            key={key}
            justifyContent="space-between"
            alignItems="center"
            gap={4}
            padding={4}
            hasRadius
            background="neutral100"
          >
            <Box width="100%">
              <PlatformHeader platformKey={key} label={label} envVars={[]} />
            </Box>
            <Badge>Not configurable yet</Badge>
          </Flex>
        ))}
      </Flex>
    </Section>
  );
};

export default PlatformsSection;
