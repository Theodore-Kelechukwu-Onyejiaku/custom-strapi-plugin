import { Flex, Loader, LinkButton } from '@strapi/design-system';
import { ArrowLeft } from '@strapi/icons';
import { NavLink } from 'react-router-dom';
import { Layouts, Page, useRBAC } from '@strapi/strapi/admin';

import ErrorAlert from '../components/settings/ErrorAlert';
import ContentTypesSection from '../components/settings/ContentTypesSection';
import PlatformsSection from '../components/settings/PlatformsSection';
import { useSettings } from '../hooks/useSettings';
import pluginPermissions from '../permissions';

// The page itself only lays things out. Each section owns its own save, and useSettings
// owns the one request that feeds them both.
const SettingsPage = () => {
  const { data, loading, error, setError, applySaved } = useSettings();
  // the server enforces this too; here it keeps the save buttons from offering a 403
  const { allowedActions } = useRBAC(pluginPermissions);
  const canUpdate = Boolean(allowedActions.canSettingsUpdate);

  return (
    <Layouts.Root>
      <Page.Title>Publishing Settings</Page.Title>
      <Layouts.Header
        title="Publishing Settings"
        subtitle="Choose what you publish, and where it goes."
        primaryAction={
          <LinkButton tag={NavLink} to=".." variant="tertiary" startIcon={<ArrowLeft />}>
            Back
          </LinkButton>
        }
      />
      <Layouts.Content>
        <ErrorAlert error={error} onClose={() => setError(null)} />

        {loading ? (
          <Flex justifyContent="center" padding={8}>
            <Loader small>Loading settings…</Loader>
          </Flex>
        ) : null}

        {!loading && data ? (
          <Flex direction="column" alignItems="stretch" gap={6}>
            <ContentTypesSection
              contentTypes={data.contentTypes}
              saved={data.settings.contentTypes}
              canUpdate={canUpdate}
              onSaved={applySaved}
              onError={setError}
            />
            <PlatformsSection
              platforms={data.platforms}
              contentTypes={data.contentTypes}
              settings={data.settings}
              canUpdate={canUpdate}
              onSaved={applySaved}
              onError={setError}
            />
          </Flex>
        ) : null}
      </Layouts.Content>
    </Layouts.Root>
  );
};

export { SettingsPage };
export default SettingsPage;
