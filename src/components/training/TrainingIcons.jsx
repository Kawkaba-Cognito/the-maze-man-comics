import React from 'react';

const I = ({ children, size = 28, c = '#f5c042', sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const IconBack = (p) => <I {...p}><path d="M20 8l-8 8 8 8"/></I>;
export const IconChevron = (p) => <I {...p}><path d="M12 8l8 8-8 8"/></I>;
export const IconLock = (p) => <I {...p}><rect x="8" y="14" width="16" height="12" rx="2"/><path d="M12 14v-3a4 4 0 018 0v3"/></I>;
export const IconFlame = (p) => <I {...p}><path d="M16 4c2 4 6 6 6 12a6 6 0 01-12 0c0-3 1-4 2-5 0 2 1 3 2 3 0-4-2-6 2-10z" fill={p.c || '#f5c042'} fillOpacity="0.25"/></I>;
export const IconPlay = (p) => <I {...p} sw={0}><path d="M10 6l16 10L10 26z" fill={p.c || '#f5c042'}/></I>;
export const IconStar = (p) => <I {...p}><path d="M16 6l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill={p.c || '#f5c042'} fillOpacity="0.2"/></I>;
export const IconClock = (p) => <I {...p}><circle cx="16" cy="16" r="11"/><path d="M16 9v7l4 3"/></I>;
