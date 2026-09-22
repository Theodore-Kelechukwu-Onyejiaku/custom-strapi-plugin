import { Box, Field, SingleSelect, SingleSelectOption } from '@strapi/design-system';

// A dropdown of attribute names. Clearing it stores null, which the server reads as
// "this field is not mapped" and skips at publish time.
const AttributeSelect = ({ name, label, required, hint, value, attributes, onChange }: any) => (
  <Box width="100%">
    <Field.Root name={name} hint={hint}>
      <Field.Label required={required}>{label}</Field.Label>
      <SingleSelect
        placeholder="Not mapped"
        value={value}
        clearLabel="Clear"
        onClear={() => onChange(null)}
        onChange={(next: string | number) => onChange(String(next))}
      >
        {attributes.map((attribute: any) => (
          <SingleSelectOption key={attribute.name} value={attribute.name}>
            {attribute.name}
          </SingleSelectOption>
        ))}
      </SingleSelect>
      <Field.Hint />
    </Field.Root>
  </Box>
);

export default AttributeSelect;
