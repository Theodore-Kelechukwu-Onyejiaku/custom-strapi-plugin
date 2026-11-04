// services/publishers/bluesky/text.ts
//
// Bluesky enforces two limits on a post, and a long one can breach either: 300 graphemes,
// and 3,000 bytes of UTF-8. They are not the same cap — 299 family emoji are 299 graphemes
// but roughly 10,000 bytes — so both are applied.

const MAX_GRAPHEMES = 300;
const MAX_BYTES = 3000;
const ELLIPSIS = '…';

// Bluesky counts graphemes, not code units: an emoji or a combining accent is one unit, so
// `String.length` would reject posts the API accepts and accept posts it rejects.
//
// Intl.Segmenter exists in Node 18+ but not in the lib this plugin compiles against, hence
// the lookup. Array.from falls back to code points, which over-counts a flag or a combining
// accent but never under-counts, so a post can only come out shorter than allowed.
const graphemesOf = (text: string): string[] => {
  const Segmenter = (Intl as any).Segmenter;
  if (!Segmenter) return Array.from(text);

  const parts = new Segmenter(undefined, { granularity: 'grapheme' }).segment(text);
  return Array.from(parts, (part: any) => part.segment);
};

// Adds graphemes until the next one would breach the byte cap, so a multi-byte character is
// never cut in half.
const clampBytes = (graphemes: string[], budget: number) => {
  let out = '';

  for (const grapheme of graphemes) {
    if (Buffer.byteLength(out + grapheme, 'utf8') > budget) break;
    out += grapheme;
  }

  return out;
};

export const fitToPost = (text: string) => {
  const graphemes = graphemesOf(text);
  const withinBoth =
    graphemes.length <= MAX_GRAPHEMES && Buffer.byteLength(text, 'utf8') <= MAX_BYTES;

  if (withinBoth) return text;

  const budget = MAX_BYTES - Buffer.byteLength(ELLIPSIS, 'utf8');
  return clampBytes(graphemes.slice(0, MAX_GRAPHEMES - 1), budget) + ELLIPSIS;
};
