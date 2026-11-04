// hooks/usePostPermissions.ts
//
// Whether the logged-in admin's role may publish and delete, so the table and the edit-view
// panel only offer buttons that will work. The server checks the same permissions on every
// request; this only hides what would be refused.

import { useRBAC } from '@strapi/strapi/admin';

import pluginPermissions from '../permissions';

const CHECKS = { publish: pluginPermissions.publish, delete: pluginPermissions.delete };

export const usePostPermissions = () => {
  const { allowedActions, isLoading } = useRBAC(CHECKS);

  // false while loading, so a button never appears and then disappears
  return {
    canPublish: !isLoading && Boolean(allowedActions.canPublish),
    canDelete: !isLoading && Boolean(allowedActions.canDelete),
  };
};
