// services/oauth/facebook.ts
//
// Facebook Login, then the Pages the user manages. The short-lived user token is swapped for
// a long-lived one first, because Page tokens fetched with a long-lived user token do not
// expire — so a Facebook connection, unlike LinkedIn's, never needs renewing.
// https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived

import axios from 'axios';

import type { Provider } from './providers';

export const GRAPH_URL = 'https://graph.facebook.com/v26.0';
const DIALOG_URL = 'https://www.facebook.com/v26.0/dialog/oauth';

export const facebookProvider: Provider = {
  authorizeUrl({ secrets, redirectUri, state, scopes }) {
    const params = new URLSearchParams({
      client_id: secrets.FACEBOOK_APP_ID ?? '',
      redirect_uri: redirectUri,
      state,
      response_type: 'code',
      scope: scopes.join(','),
    });
    return `${DIALOG_URL}?${params}`;
  },

  async connect({ code, secrets, redirectUri }) {
    const app = {
      client_id: secrets.FACEBOOK_APP_ID,
      client_secret: secrets.FACEBOOK_APP_SECRET,
    };

    const { data: short } = await axios.get(`${GRAPH_URL}/oauth/access_token`, {
      params: { ...app, redirect_uri: redirectUri, code },
    });

    const { data: long } = await axios.get(`${GRAPH_URL}/oauth/access_token`, {
      params: { ...app, grant_type: 'fb_exchange_token', fb_exchange_token: short.access_token },
    });

    const { data: accounts } = await axios.get(`${GRAPH_URL}/me/accounts`, {
      params: { fields: 'id,name,access_token', access_token: long.access_token },
    });

    const pages = (accounts?.data ?? []).map((page: any) => ({
      id: page.id,
      name: page.name,
      accessToken: page.access_token,
    }));

    if (pages.length === 0) {
      throw new Error('This account does not manage any Facebook Pages, or none were allowed.');
    }

    // the first Page is the default; the settings page lets the editor pick another
    return {
      accountId: pages[0].id,
      accountName: pages[0].name,
      accessToken: pages[0].accessToken,
      expiresAt: null,
      pages,
    };
  },
};
