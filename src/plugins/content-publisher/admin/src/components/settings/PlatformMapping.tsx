import { Box, Flex, Typography } from '@strapi/design-system';

import FieldMapRow from './FieldMapRow';
import type { ContentType, FieldMap, Platform } from '../../utils/settingsTypes';

type Props = {
  platform: Platform;
  contentType: ContentType;
  contentTypes: ContentType[];
  fieldMap: FieldMap;
  onChange: (key: string, value: string | null) => void;
};

// One collection type's mapping for one platform. Grouped per type because two types can
// name the same concept differently — a Blog's `body` and an Article's `section` both
// feed dev.to's `body_markdown`.
const PlatformMapping = ({ platform, contentType, contentTypes, fieldMap, onChange }: Props) => (
  <Box padding={4} hasRadius background="neutral100">
    <Box paddingBottom={4}>
      <Typography variant="pi" fontWeight="bold" textColor="neutral600">
        {contentType.displayName}
      </Typography>
    </Box>
    <Flex direction="column" alignItems="stretch" gap={4}>
      {platform.fields.map((field) => (
        <FieldMapRow
          key={field.key}
          field={field}
          contentType={contentType}
          contentTypes={contentTypes}
          fieldMap={fieldMap}
          onChange={onChange}
        />
      ))}
    </Flex>
  </Box>
);

export default PlatformMapping;
