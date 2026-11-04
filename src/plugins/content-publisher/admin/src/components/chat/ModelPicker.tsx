// components/chat/ModelPicker.tsx
//
// Which Claude model answers. Sits under the message box; a change applies from the next
// message. Hidden when the server sent no list.

import { SingleSelect, SingleSelectOption } from '@strapi/design-system';

import type { ChatModel } from '../../hooks/useChatModels';

type Props = {
  models: ChatModel[];
  value?: string;
  onChange: (id: string) => void;
  disabled: boolean;
};

const ModelPicker = ({ models, value, onChange, disabled }: Props) => {
  if (models.length === 0 || !value) return null;

  return (
    <SingleSelect
      size="S"
      aria-label="Claude model"
      value={value}
      onChange={(id: string | number) => onChange(String(id))}
      disabled={disabled}
    >
      {models.map((model) => (
        <SingleSelectOption key={model.id} value={model.id}>
          {model.label}
        </SingleSelectOption>
      ))}
    </SingleSelect>
  );
};

export default ModelPicker;
