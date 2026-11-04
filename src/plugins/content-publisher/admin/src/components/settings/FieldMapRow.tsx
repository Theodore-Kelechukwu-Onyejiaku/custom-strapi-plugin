import { Flex } from '@strapi/design-system';

import AttributeSelect from './AttributeSelect';
import { ITEM_SUFFIX } from '../../utils/settingsTypes';
import type { ContentType, PlatformField } from '../../utils/settingsTypes';

type Props = {
  field: PlatformField;
  contentType: ContentType;
  contentTypes: ContentType[];
  fieldMap: Record<string, string | null>;
  onChange: (key: string, value: string | null) => void;
};

// One row per platform field. The dropdown offers only attributes whose type the platform
// accepts, so a cover image row never lists a richtext field. Relations get a second
// dropdown for the attribute on the related type that holds the text.
const FieldMapRow = ({ field, contentType, contentTypes, fieldMap, onChange }: Props) => {
  const value = fieldMap[field.key] ?? null;
  const options = contentType.attributes.filter((one) => field.accepts.includes(one.type));

  const relation = contentType.attributes.find(
    (one) => one.name === value && one.type === 'relation'
  );
  const target = relation ? contentTypes.find((one) => one.uid === relation.target) : undefined;
  const itemKey = `${field.key}${ITEM_SUFFIX}`;

  return (
    <Flex gap={4} alignItems="flex-start">
      <AttributeSelect
        name={field.key}
        label={field.label}
        required={field.required}
        hint={field.hint}
        value={value}
        attributes={options}
        onChange={(next: string | null) => onChange(field.key, next)}
      />

      {target ? (
        <AttributeSelect
          name={itemKey}
          label={`${target.displayName} field`}
          value={fieldMap[itemKey] ?? null}
          attributes={target.attributes}
          onChange={(next: string | null) => onChange(itemKey, next)}
        />
      ) : null}
    </Flex>
  );
};

export default FieldMapRow;
