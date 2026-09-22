import { Box, Field, MultiSelect, MultiSelectOption, Button } from '@strapi/design-system';
import { Check } from '@strapi/icons';

import Section from './Section';
import { useContentTypes } from '../../hooks/useContentTypes';
import type { ContentType, Settings } from '../../utils/settingsTypes';

const HINT =
  'Pick the collection types you want to publish from. Only these are offered when mapping fields for each platform.';

type Props = {
  contentTypes: ContentType[];
  saved: string[];
  canUpdate: boolean;
  onSaved: (settings: Settings) => void;
  onError: (message: string) => void;
};

const ContentTypesSection = ({ contentTypes, saved, canUpdate, onSaved, onError }: Props) => {
  const { selected, setSelected, save, saving, isDirty } = useContentTypes({
    saved,
    onSaved,
    onError,
  });

  return (
    <Section title="Collection types" hint={HINT}>
      <Box maxWidth="480px">
        <Field.Root name="collection-types">
          <Field.Label>Publish from</Field.Label>
          <MultiSelect
            placeholder="Select one or more collection types"
            value={selected}
            onChange={(values: string[]) => setSelected(values)}
            withTags
          >
            {contentTypes.map((contentType) => (
              <MultiSelectOption key={contentType.uid} value={contentType.uid}>
                {contentType.displayName}
              </MultiSelectOption>
            ))}
          </MultiSelect>
          <Field.Hint />
        </Field.Root>
        <Box paddingTop={4}>
          <Button onClick={save} startIcon={<Check />} loading={saving} disabled={!isDirty || !canUpdate}>
            {isDirty ? 'Save' : 'Saved'}
          </Button>
        </Box>
      </Box>
    </Section>
  );
};

export default ContentTypesSection;
