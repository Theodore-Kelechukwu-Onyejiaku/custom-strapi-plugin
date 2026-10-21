import { Box, Divider, Typography } from '@strapi/design-system';

import PlatformCredentials from './PlatformCredentials';
import PlatformConnection from './PlatformConnection';
import PlatformForm from './PlatformForm';

// What sits inside an open accordion row: whether the platform's .env keys are set (or, for
// LinkedIn and Facebook, the Connect button), then its field mapping.
//
// The key status shows whether or not the platform is switched on, so someone setting it up
// can see what is still missing before turning it on.
const PlatformPanel = ({ platform, contentTypes, types, form, enabled, ...rest }: any) => (
  <>
    {/* LinkedIn and Facebook read their app credentials from .env and sign in instead */}
    {platform.oauth ? (
      <PlatformConnection
        platform={platform}
        connection={rest.connection}
        summaries={rest.summaries}
        canUpdate={rest.canUpdate}
        onSaved={rest.onSaved}
        onError={rest.onError}
      />
    ) : (
      <PlatformCredentials platform={platform} summaries={rest.summaries} />
    )}

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
