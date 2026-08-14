import React from 'react';

// Official Circle Flags SVGs (identical to Circle Flags open-source pack)
export const FlagGB: React.FC<{ size?: number; className?: string }> = ({ size = 44, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" className={className} xmlns="http://www.w3.org/2000/svg">
    <mask id="flag-gb-mask">
      <circle cx="256" cy="256" r="256" fill="#fff" />
    </mask>
    <g mask="url(#flag-gb-mask)">
      <path fill="#00247d" d="M0 0h512v512H0z"/>
      <path stroke="#fff" strokeWidth="60" d="m0 0 512 512M512 0 0 512"/>
      <path stroke="#cf142b" strokeWidth="40" d="m0 0 512 512M512 0 0 512"/>
      <path stroke="#fff" strokeWidth="100" d="M256 0v512M0 256h512"/>
      <path stroke="#cf142b" strokeWidth="60" d="M256 0v512M0 256h512"/>
    </g>
  </svg>
);

export const FlagFR: React.FC<{ size?: number; className?: string }> = ({ size = 44, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" className={className} xmlns="http://www.w3.org/2000/svg">
    <mask id="flag-fr-mask">
      <circle cx="256" cy="256" r="256" fill="#fff" />
    </mask>
    <g mask="url(#flag-fr-mask)">
      <path fill="#002654" d="M0 0h170.7v512H0z"/>
      <path fill="#fff" d="M170.7 0h170.6v512H170.7z"/>
      <path fill="#ce1126" d="M341.3 0H512v512H341.3z"/>
    </g>
  </svg>
);

export const FlagIT: React.FC<{ size?: number; className?: string }> = ({ size = 44, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" className={className} xmlns="http://www.w3.org/2000/svg">
    <mask id="flag-it-mask">
      <circle cx="256" cy="256" r="256" fill="#fff" />
    </mask>
    <g mask="url(#flag-it-mask)">
      <path fill="#009246" d="M0 0h170.7v512H0z"/>
      <path fill="#fff" d="M170.7 0h170.6v512H170.7z"/>
      <path fill="#ce2b37" d="M341.3 0H512v512H341.3z"/>
    </g>
  </svg>
);

export const FlagDE: React.FC<{ size?: number; className?: string }> = ({ size = 44, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" className={className} xmlns="http://www.w3.org/2000/svg">
    <mask id="flag-de-mask">
      <circle cx="256" cy="256" r="256" fill="#fff" />
    </mask>
    <g mask="url(#flag-de-mask)">
      <path fill="#000" d="M0 0h512v170.7H0z"/>
      <path fill="#d00" d="M0 170.7h512v170.6H0z"/>
      <path fill="#ffce00" d="M0 341.3h512V512H0z"/>
    </g>
  </svg>
);
