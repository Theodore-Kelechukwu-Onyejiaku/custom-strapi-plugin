import { useState } from 'react';
import { Box, Button, Field, Flex, TextInput } from '@strapi/design-system';

import type { CredentialSummary } from '../../utils/settingsTypes';

// The server only ever tells us whether a key is set, where it came from and its last four
// characters — never the key — so the input always starts empty and never shows a value.
const hintFor = (summary?: CredentialSummary) => {
  if (!summary?.configured) {
    return 'Not set. Publishing to this platform will fail until it is.';
  }
  const where = summary.source === 'env' ? 'from the environment' : 'saved here';
  return `Set ${where}, ending ${summary.last4}. Enter a new value to replace it.`;
};

const CredentialField = ({ name, summary, saving, canUpdate, onSave }: any) => {
  const [value, setValue] = useState('');

  const submit = async () => {
    await onSave(name, value);
    setValue(''); // never keep the secret around after it has been sent
  };

  return (
    <Field.Root name={name} hint={hintFor(summary)}>
      <Field.Label>{name}</Field.Label>

      {/* the buttons sit in the same row as the input, so they line up with it rather than
          with the bottom of the hint underneath */}
      <Flex gap={2} alignItems="center">
        <Box width="100%">
          <TextInput
            type="password"
            autoComplete="off"
            value={value}
            placeholder={summary?.configured ? '••••••••' : 'Not set'}
            disabled={!canUpdate}
            onChange={(event: any) => setValue(event.target.value)}
          />
        </Box>

        <Button onClick={submit} loading={saving === name} disabled={!value || !canUpdate}>
          Save
        </Button>

        {summary?.source === 'settings' && canUpdate ? (
          <Button variant="tertiary" onClick={() => onSave(name, '')} disabled={saving === name}>
            Clear
          </Button>
        ) : null}
      </Flex>

      <Field.Hint />
    </Field.Root>
  );
};

export default CredentialField;
