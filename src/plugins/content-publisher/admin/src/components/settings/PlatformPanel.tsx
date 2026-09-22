import { Box, Divider, Typography } from '@strapi/design-system';

import PlatformCredentials from './PlatformCredentials';
import PlatformForm from './PlatformForm';

// What sits inside an open accordion row: the platform's API keys, then its field mapping.
//
// Credentials show whether or not the platform is switched on — you normally paste the key
// first and turn the platform on afterwards, so hiding them behind the switch made the keys
// unreachable for exactly the person trying to set them up.
const PlatformPanel = ({ platform, contentTypes, types, form, enabled, ...rest }: any) => (
  <>
    <PlatformCredentials
      platform={platform}
      summaries={rest.summaries}
      canUpdate={rest.canUpdate}
      onSaved={rest.onSaved}
      onError={rest.onError}
    />

    <Box paddingTop={6} paddingBottom={6}>
      <Divider />
    </Box>

    {enabled ? (
      <PlatformForm
        platform={platform}
        contentTypes={contentTypes}
        types={types}
        form={form}
        canUpdate={rest.canUpdate}
      />
    ) : (
      <Typography variant="omega" textColor="neutral600">
        {platform.label} is off, so nothing publishes to it. Turn it on to map its fields.
      </Typography>
    )}
  </>
);

export default PlatformPanel;
