import { Accordion } from '@strapi/design-system';

import Section from './Section';
import PlatformCard from './PlatformCard';
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

  return (
    <Section title="Platforms" hint={HINT}>
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
            connection={settings.connections?.[platform.key]}
            canUpdate={canUpdate}
            onSaved={onSaved}
            onError={onError}
          />
        ))}
      </Accordion.Root>
    </Section>
  );
};

export default PlatformsSection;
