import { LinkButton, Typography } from '@strapi/design-system';
import { Cog } from '@strapi/icons';
import { Layouts, Page } from '@strapi/strapi/admin';
import { NavLink } from 'react-router-dom';

import PublishingTable from '../components/PublishingTable';

// Relative to the plugin route, so it resolves to /plugins/content-publisher/settings.
const SETTINGS_URL = 'settings';

const HomePage = () => {
  return (
    <Layouts.Root>
      <Page.Title>Content Publisher</Page.Title>
      <Layouts.Header
        title="Content Publisher"
        subtitle="Publish your content to Dev.to, Medium and more."
        primaryAction={
          <LinkButton tag={NavLink} to={SETTINGS_URL} variant="secondary" startIcon={<Cog />}>
            <Typography fontSize={2} fontWeight="bold">
              Publishing settings
            </Typography>
          </LinkButton>
        }
      />
      <Layouts.Content>
        <PublishingTable />
      </Layouts.Content>
    </Layouts.Root>
  );
};

export { HomePage };
