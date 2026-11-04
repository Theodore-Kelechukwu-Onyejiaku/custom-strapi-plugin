import { Box, Flex, Typography, Button } from '@strapi/design-system';
import { Check } from '@strapi/icons';

import PlatformMapping from './PlatformMapping';

// The mapping form for one platform: a group per collection type, then one Save. The
// button reads "Saved" and disables once there is nothing left to send, which is how the
// page confirms a save landed alongside the notification.
const PlatformForm = ({ platform, contentTypes, types, form, canUpdate }: any) => {
  if (types.length === 0) {
    return (
      <Typography variant="omega" textColor="neutral600">
        Save a collection type above to map {platform.label}'s fields.
      </Typography>
    );
  }

  return (
    <Flex direction="column" alignItems="stretch" gap={4}>
      {types.map((contentType: any) => (
        <PlatformMapping
          key={contentType.uid}
          platform={platform}
          contentType={contentType}
          contentTypes={contentTypes}
          fieldMap={form.mapping[contentType.uid] ?? {}}
          onChange={(key: string, value: string | null) =>
            form.setField(contentType.uid, key, value)
          }
        />
      ))}
      <Box>
        <Button
          onClick={form.save}
          startIcon={<Check />}
          loading={form.saving}
          disabled={!form.isDirty || !canUpdate}
        >
          {form.isDirty ? 'Save mapping' : 'Saved'}
        </Button>
      </Box>
    </Flex>
  );
};

export default PlatformForm;
