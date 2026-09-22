import { Flex, Menu, Typography } from '@strapi/design-system';
import { Check } from '@strapi/icons';

import type { PlatformTarget } from '../platformTargets';

// One action per row rather than one button per platform. The menu offers only the platforms
// this entry is not on yet, plus a single item to send it everywhere remaining — which was
// previously three separate clicks with a full page reload between each.
const PublishMenu = ({ post, platforms, busy, onPublish }: any) => {
  const remaining = platforms.filter((target: PlatformTarget) => !post[target.linkField]);

  if (platforms.length === 0) return null;

  if (remaining.length === 0) {
    return (
      <Flex gap={1} alignItems="center">
        <Check fill="success600" />
        <Typography variant="pi" textColor="success600">
          All done
        </Typography>
      </Flex>
    );
  }

  return (
    <Menu.Root>
      <Menu.Trigger variant="secondary" size="S" disabled={Boolean(busy)}>
        {busy ? 'Publishing…' : `Publish (${remaining.length})`}
      </Menu.Trigger>
      <Menu.Content zIndex={10}>
        {remaining.map((target: PlatformTarget) => (
          <Menu.Item key={target.type} onSelect={() => onPublish([target])}>
            <Flex gap={2} alignItems="center">
              <target.Icon />
              <Typography>{target.label}</Typography>
            </Flex>
          </Menu.Item>
        ))}
        {remaining.length > 1 ? (
          <Menu.Item onSelect={() => onPublish(remaining)}>
            <Typography fontWeight="bold">Everywhere remaining</Typography>
          </Menu.Item>
        ) : null}
      </Menu.Content>
    </Menu.Root>
  );
};

export default PublishMenu;
