import { Box, Field, SingleSelect, SingleSelectOption } from '@strapi/design-system';

// Facebook only. Signing in grants every Page the user ticked; this picks which one posts go
// to. The first Page is the default until something else is chosen.
const PageSelect = ({ account, actions, canUpdate }: any) => (
  <Box paddingTop={4} maxWidth="400px">
    <Field.Root name="facebook-page" hint="Posts are published as this Page.">
      <Field.Label>Page</Field.Label>
      <SingleSelect
        value={account.accountId}
        onChange={(pageId: string) => actions.selectPage(pageId)}
        disabled={!canUpdate || actions.busy === 'page'}
      >
        {account.pages.map((page: { id: string; name: string }) => (
          <SingleSelectOption key={page.id} value={page.id}>
            {page.name}
          </SingleSelectOption>
        ))}
      </SingleSelect>
      <Field.Hint />
    </Field.Root>
  </Box>
);

export default PageSelect;
