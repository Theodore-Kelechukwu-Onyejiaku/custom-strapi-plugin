import { useState } from 'react';
import { IconButton } from '@strapi/design-system';
import { Check, Duplicate } from '@strapi/icons';

// Copies an answer to the clipboard, like the copy button under ChatGPT and Claude replies.
// It shows a tick for a moment so the editor knows it worked.
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // the browser blocked the clipboard; nothing useful to show
    }
  };

  return (
    <IconButton label={copied ? 'Copied' : 'Copy'} variant="ghost" size="S" onClick={copy}>
      {copied ? <Check /> : <Duplicate />}
    </IconButton>
  );
};

export default CopyButton;
