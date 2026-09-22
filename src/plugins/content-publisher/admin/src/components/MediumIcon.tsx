import React from 'react';

// The Medium wordmark, in its own proportions (1043.63 x 592.71) rather than squashed into a
// square. The viewBox pads it and centres it vertically so it sits on the same optical
// baseline as the other platform icons.
//
// `currentColor`, not a hardcoded near-black: the previous #0F0F0F disappeared against
// Strapi's dark theme.
export default function MediumIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Medium"
      role="img"
      viewBox="-83 -308.46 1209.63 1209.63"
      width="24px"
      height="24px"
      fill="currentColor"
    >
      <path d="M588.67 296.36c0 163.67-131.78 296.35-294.33 296.35S0 460 0 296.36 131.78 0 294.34 0s294.33 132.69 294.33 296.36" />
      <path d="M911.56 296.36c0 154.06-65.89 278.97-147.17 278.97s-147.17-124.91-147.17-278.97S683.1 17.39 764.39 17.39s147.17 124.91 147.17 278.97" />
      <path d="M1043.63 296.36c0 138-23.17 249.94-51.76 249.94s-51.75-111.91-51.75-249.94 23.17-249.94 51.75-249.94 51.76 111.9 51.76 249.94" />
    </svg>
  );
}
