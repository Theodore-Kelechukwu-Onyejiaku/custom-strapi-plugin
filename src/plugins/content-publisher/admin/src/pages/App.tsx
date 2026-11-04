import { Page } from '@strapi/strapi/admin';
import { Routes, Route } from 'react-router-dom';

import { HomePage } from './HomePage';
import { SettingsPage } from './SettingsPage';
import pluginPermissions from '../permissions';
import ChatLauncher from '../components/chat/ChatLauncher';

// Protecting at the route rather than inside each page, so a user who types the settings
// URL directly is stopped by the same check that hides the link.
const App = () => {
  return (
    <>
      {/* the floating chat button, on every page of the plugin */}
      <ChatLauncher />
      <Routes>
        <Route
          index
          element={
            <Page.Protect permissions={pluginPermissions.read}>
              <HomePage />
            </Page.Protect>
          }
        />
        <Route
          path="settings"
          element={
            <Page.Protect permissions={pluginPermissions.settingsRead}>
              <SettingsPage />
            </Page.Protect>
          }
        />
        <Route path="*" element={<Page.Error />} />
      </Routes>
    </>
  );
};

export { App };
