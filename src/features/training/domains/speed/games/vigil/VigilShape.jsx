import React from 'react';

/** Renders one vigil stimulus shape. size: xs | sm | md | lg */
export default function VigilShape({ shape = 'square', size = 'md', className = '' }) {
  const id = ['square', 'circle', 'triangle', 'diamond', 'hexagon'].includes(shape)
    ? shape
    : 'circle';
  return (
    <div
      className={`ct-vigil-shape ct-vigil-shape--${id} ct-vigil-shape--${size}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    />
  );
}

export function VigilShapeRow({ shapes, size = 'sm' }) {
  return (
    <div className="ct-vigil-shape-row" aria-hidden="true">
      {shapes.map((s) => (
        <VigilShape key={s} shape={s} size={size} />
      ))}
    </div>
  );
}
